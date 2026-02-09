const INCIDENT_STATUS = {
  idle: "Sin incidentes activos.",
  created: "Incidente registrado. Esperando propuesta CAD.",
  proposed: "Ambulancia propuesta. Pendiente de aceptación.",
  assigned: "Ambulancia asignada. Logística debe contactar auxiliares.",
  dispatched: "Ambulancia notificada. Operador de radio en seguimiento.",
};

class Incident {
  constructor({ id, location, lat, lng, time }) {
    this.id = id;
    this.location = location;
    this.lat = lat;
    this.lng = lng;
    this.time = time;
    this.createdAt = new Date();
  }
}

class Ambulance {
  constructor({ id, name, lat, lng }) {
    this.id = id;
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.status = "Disponible";
  }

  updateStatus(status) {
    this.status = status;
  }
}

class CADSystem {
  constructor(ambulances) {
    this.ambulances = ambulances;
    this.resetProposalQueue();
  }

  resetProposalQueue() {
    this.proposalQueue = [];
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const radius = 6371;
    const toRad = (value) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radius * c;
  }

  rankAmbulances(incident) {
    return this.ambulances
      .map((ambulance) => {
        const distance = this.calculateDistance(
          incident.lat,
          incident.lng,
          ambulance.lat,
          ambulance.lng
        );
        return { ambulance, distance };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  proposeAmbulance(incident) {
    if (this.proposalQueue.length === 0) {
      this.proposalQueue = this.rankAmbulances(incident);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const next = this.proposalQueue.shift();
        if (!next) {
          reject(new Error("No hay ambulancias disponibles"));
          return;
        }
        resolve(next);
      }, 800);
    });
  }
}

class LogisticsOperator {
  callAmbulance(ambulance, incident) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `Llamada a ${ambulance.name} realizada. Instrucciones: ir a ${incident.location}.`
        );
      }, 900);
    });
  }
}

class RadioOperator {
  guideAmbulance(ambulance, incident) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          `Radio en línea con ${ambulance.name}. Guía hacia ${incident.location} en curso.`
        );
      }, 700);
    });
  }
}

const ambulances = [
  new Ambulance({
    id: "AMB-101",
    name: "Ambulancia 101",
    lat: 51.5079,
    lng: -0.0877,
  }),
  new Ambulance({
    id: "AMB-202",
    name: "Ambulancia 202",
    lat: 51.5007,
    lng: -0.1246,
  }),
  new Ambulance({
    id: "AMB-303",
    name: "Ambulancia 303",
    lat: 51.5154,
    lng: -0.0722,
  }),
  new Ambulance({
    id: "AMB-404",
    name: "Ambulancia 404",
    lat: 51.5094,
    lng: -0.0983,
  }),
];

const cadSystem = new CADSystem(ambulances);
const logisticsOperator = new LogisticsOperator();
const radioOperator = new RadioOperator();

let activeIncident = null;
let activeProposal = null;
let assignedAmbulance = null;

const incidentForm = document.getElementById("incident-form");
const incidentStatus = document.getElementById("incident-status");
const proposalDetails = document.getElementById("proposal-details");
const proposeBtn = document.getElementById("propose-btn");
const acceptBtn = document.getElementById("accept-btn");
const rejectBtn = document.getElementById("reject-btn");
const callBtn = document.getElementById("call-btn");
const callConfirmation = document.getElementById("call-confirmation");
const logisticsStatus = document.getElementById("logistics-status");
const guideBtn = document.getElementById("guide-btn");
const radioStatus = document.getElementById("radio-status");
const logList = document.getElementById("log");

const map = L.map("map").setView([51.5074, -0.1278], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const ambulanceLayer = L.layerGroup().addTo(map);
const incidentLayer = L.layerGroup().addTo(map);

const icons = {
  available: L.icon({
    iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  assigned: L.icon({
    iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/green.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
  incident: L.icon({
    iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }),
};

const addLog = (message) => {
  const item = document.createElement("li");
  const time = new Date().toLocaleTimeString("es-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  item.textContent = `[${time}] ${message}`;
  logList.prepend(item);
};

const updateIncidentStatus = (statusKey) => {
  incidentStatus.innerHTML = `<strong>Estado:</strong> ${INCIDENT_STATUS[statusKey]}`;
};

const refreshAmbulanceMarkers = () => {
  ambulanceLayer.clearLayers();
  ambulances.forEach((ambulance) => {
    const icon = ambulance === assignedAmbulance ? icons.assigned : icons.available;
    L.marker([ambulance.lat, ambulance.lng], { icon })
      .addTo(ambulanceLayer)
      .bindPopup(`${ambulance.name} · ${ambulance.status}`);
  });
};

const renderIncidentMarker = () => {
  incidentLayer.clearLayers();
  if (!activeIncident) {
    return;
  }
  L.marker([activeIncident.lat, activeIncident.lng], { icon: icons.incident })
    .addTo(incidentLayer)
    .bindPopup(`Incidente: ${activeIncident.location}`)
    .openPopup();
  map.setView([activeIncident.lat, activeIncident.lng], 14);
};

const resetFlow = () => {
  activeProposal = null;
  assignedAmbulance = null;
  cadSystem.resetProposalQueue();
  proposalDetails.innerHTML = "<p>Esperando propuesta del sistema CAD.</p>";
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;
  callBtn.disabled = true;
  callConfirmation.checked = false;
  guideBtn.disabled = true;
  logisticsStatus.innerHTML =
    "<strong>Estado:</strong> Sin asignación activa.";
  radioStatus.innerHTML =
    "<strong>Estado:</strong> Esperando ambulancia asignada.";
};

const setProposalUI = (proposal) => {
  proposalDetails.innerHTML = `
    <p><strong>${proposal.ambulance.name}</strong></p>
    <p>Distancia estimada: ${proposal.distance.toFixed(2)} km</p>
    <p>Estado actual: ${proposal.ambulance.status}</p>
  `;
};

incidentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const location = document.getElementById("incident-location").value.trim();
  const lat = Number(document.getElementById("incident-lat").value);
  const lng = Number(document.getElementById("incident-lng").value);
  const time = document.getElementById("incident-time").value;

  activeIncident = new Incident({
    id: `INC-${Date.now()}`,
    location,
    lat,
    lng,
    time,
  });

  resetFlow();
  updateIncidentStatus("created");
  renderIncidentMarker();
  refreshAmbulanceMarkers();
  addLog(`Incidente registrado en ${location} (hora ${time}).`);
});

proposeBtn.addEventListener("click", () => {
  if (!activeIncident) {
    addLog("No hay incidente registrado para procesar.");
    return;
  }
  updateIncidentStatus("proposed");
  proposalDetails.innerHTML = "<p>Calculando mejor opción...</p>";
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;

  cadSystem
    .proposeAmbulance(activeIncident)
    .then((proposal) => {
      activeProposal = proposal;
      setProposalUI(proposal);
      addLog(
        `CAD propone ${proposal.ambulance.name} a ${proposal.distance.toFixed(
          2
        )} km.`
      );
      acceptBtn.disabled = false;
      rejectBtn.disabled = false;
    })
    .catch((error) => {
      proposalDetails.innerHTML = `<p>${error.message}</p>`;
      addLog("No hay ambulancias disponibles para proponer.");
    });
});

acceptBtn.addEventListener("click", () => {
  if (!activeProposal) {
    return;
  }
  assignedAmbulance = activeProposal.ambulance;
  assignedAmbulance.updateStatus("Asignada");
  updateIncidentStatus("assigned");
  addLog(`Operario acepta propuesta: ${assignedAmbulance.name}.`);
  logisticsStatus.innerHTML = `<strong>Estado:</strong> ${assignedAmbulance.name} asignada.`;
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;
  callBtn.disabled = false;
  refreshAmbulanceMarkers();
});

rejectBtn.addEventListener("click", () => {
  addLog("Operario rechaza propuesta actual. Solicitando nueva.");
  proposeBtn.click();
});

callBtn.addEventListener("click", () => {
  if (!assignedAmbulance || !activeIncident) {
    return;
  }
  callBtn.disabled = true;
  logisticsStatus.innerHTML = "<strong>Estado:</strong> Contactando auxiliares...";

  logisticsOperator.callAmbulance(assignedAmbulance, activeIncident).then((message) => {
    logisticsStatus.innerHTML = `<strong>Estado:</strong> ${message}`;
    callConfirmation.checked = true;
    assignedAmbulance.updateStatus("En ruta");
    updateIncidentStatus("dispatched");
    guideBtn.disabled = false;
    refreshAmbulanceMarkers();
    addLog(message);
  });
});

callConfirmation.addEventListener("change", () => {
  if (!callConfirmation.checked) {
    return;
  }
  addLog("Operador logístico confirma llamada a auxiliares.");
});

guideBtn.addEventListener("click", () => {
  if (!assignedAmbulance || !activeIncident) {
    return;
  }
  guideBtn.disabled = true;
  radioStatus.innerHTML = "<strong>Estado:</strong> Conectando por radio...";

  radioOperator.guideAmbulance(assignedAmbulance, activeIncident).then((message) => {
    radioStatus.innerHTML = `<strong>Estado:</strong> ${message}`;
    addLog(message);
  });
});

refreshAmbulanceMarkers();
updateIncidentStatus("idle");
