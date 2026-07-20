// URL base del backend. Averlo in una costante evita di riscrivere
// "http://localhost:8000" in ogni funzione — se un giorno il backend
// gira altrove, cambi solo questa riga.
const API_URL = "http://localhost:8000";


// --- FUNZIONE 1: leggere i dati aggregati e disegnare la tabella ---
//
// "async" prima di "function" dice a JavaScript: questa funzione contiene
// operazioni che richiedono tempo (qui, una richiesta di rete), e potrà
// usare "await" al suo interno.
async function loadSummary() {

  // fetch() manda la richiesta HTTP e ritorna una Promise — un oggetto
  // che rappresenta "un risultato che arriverà, ma non subito".
  // "await" mette in pausa QUESTA funzione (non tutto il programma)
  // finché la risposta non arriva, poi continua con quello che segue.
  const response = await fetch(`${API_URL}/entries/sumup`);

  // response è la risposta HTTP grezza (status code, headers...).
  // .json() legge il BODY della risposta e lo converte da testo JSON
  // a un oggetto/array JavaScript vero e proprio. Anche questa è
  // un'operazione asincrona, quindi await di nuovo.
  const data = await response.json();
  // a questo punto "data" è l'equivalente della lista di dict che
  // il tuo endpoint FastAPI restituisce: es.
  // [{ambito: "LangGraph", ore_totali: 62, numero_entries: 12}, ...]

  // Prendiamo il <tbody> vuoto che avevamo preparato in HTML.
  const tbody = document.getElementById("summary-table-body");

  // Lo svuotiamo prima di riempirlo, così se questa funzione viene
  // richiamata più volte (es. dopo un nuovo inserimento) non accumuliamo
  // righe duplicate ogni volta.
  tbody.innerHTML = "";

  // Per ogni ambito ricevuto dal backend, costruiamo UNA riga <tr>.
  data.forEach((ambito) => {
    const row = document.createElement("tr");
    // createElement crea l'elemento in memoria: esiste, ma non è ancora
    // visibile nella pagina finché non lo "attacchi" da qualche parte.

    row.innerHTML = `
      <td>${ambito.subject}</td>
      <td>${ambito.total_hours}h</td>
    `;
    // innerHTML qui è comodo per inserire due celle in un colpo solo.
    // Le backtick ` ` (non apici normali) permettono i template literal:
    // dentro ${...} puoi inserire variabili JavaScript direttamente
    // nella stringa, senza concatenare con +.

    // appendChild aggiunge davvero la riga dentro il tbody nella pagina —
    // è questo il momento in cui diventa visibile.
    tbody.appendChild(row);
  });
}


// --- Eseguire la funzione quando la pagina è pronta ---
//
// Se chiamassi loadSummary() subito, rischi che il browser non abbia
// ancora finito di costruire il <tbody> a cui vuoi accedere.
// DOMContentLoaded è un evento che il browser lancia quando l'HTML
// è stato completamente letto e trasformato in DOM (albero di elementi).
document.addEventListener("DOMContentLoaded", () => {
  loadSummary();
});