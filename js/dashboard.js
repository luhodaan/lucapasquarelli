// URL dell'export CSV pubblico del tuo Google Sheet.
// Sostituisci con il tuo link reale (Step 1 sopra).

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAfC5HiWnx1ixplWZZkpjJybS49m5eA_16fd2fwN3MXUr96txE7bGmW-7YGAK15vP8krb4hBBuHUz3/pub?gid=0&single=true&output=csv";

// --- FUNZIONE 1: scaricare il CSV e trasformarlo in dati utilizzabili ---
async function loadData() {
  const response = await fetch(CSV_URL);
  const csvText = await response.text();
  // csvText a questo punto è una grande stringa grezza, tipo:
  // "subject,hours\nThis Website,5\nPodcast,3\n"

  const rows = parseCSV(csvText);
  const summary = aggregateBySubject(rows);

  renderTable(summary);
}


// --- FUNZIONE 2: trasformare il testo CSV in un array di oggetti ---
function parseCSV(csvText) {
  // .trim() toglie spazi/newline superflui a inizio/fine testo.
  // .split("\n") spezza il testo in un array di righe.
  const lines = csvText.trim().split("\n");

  // La prima riga è l'intestazione (es. "subject,hours") — la usiamo
  // per sapere i NOMI dei campi, non è un dato vero da mostrare.
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  // .slice(1) prende tutte le righe TRANNE la prima (l'intestazione).
  const dataLines = lines.slice(1);

  // Per ogni riga di dati, costruiamo un oggetto tipo {subject: "...", hours: "..."}
  // abbinando ogni valore al nome di colonna nella stessa posizione.
  return dataLines.map((line) => {
    const values = line.split(",");
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = values[index]?.trim();
      // "?." (optional chaining): se values[index] non esiste (riga più corta
      // del previsto), non lancia errore, restituisce undefined invece di crashare.
    });
    return entry;
  });
}


// --- FUNZIONE 3: sommare le ore per ambito (equivalente del GROUP BY SQL) ---
function aggregateBySubject(rows) {
  // Un oggetto JavaScript usato come "dizionario": chiave = subject,
  // valore = somma ore accumulata finora per quel subject.
  const totals = {};

  rows.forEach((row) => {
    const subject = row.subject;
    const hours = parseFloat(row.hours) || 0;
    // parseFloat converte la stringa "5" nel numero 5. Se il campo
    // fosse vuoto o non numerico, "|| 0" evita un NaN che romperebbe le somme.

    // Se il subject non è ancora nel dizionario, lo inizializziamo a 0
    // prima di sommarci sopra — altrimenti "totals[subject] + hours"
    // darebbe NaN al primo incontro (undefined + numero = NaN).
    if (!totals[subject]) {
      totals[subject] = 0;
    }
    totals[subject] += hours;
  });

  // Object.entries() trasforma il dizionario {A: 5, B: 3} in una lista
  // di coppie [["A", 5], ["B", 3]] — più comoda da ordinare e iterare.
  return Object.entries(totals)
    .map(([subject, hours]) => ({ subject, hours }))
    .sort((a, b) => b.hours - a.hours); // ordine decrescente, ambito più tracciato prima
}


// --- FUNZIONE 5: disegnare la tabella di dettaglio ---
function renderTable(summary) {
  const tbody = document.getElementById("summary-table-body");
  tbody.innerHTML = "";

  summary.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.subject}</td>
      <td>${entry.hours}h</td>
    `;
    tbody.appendChild(row);
  });
}


// --- Avvio ---
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});