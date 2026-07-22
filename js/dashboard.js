// URL base del backend. Averlo in una costante evita di riscrivere
// "http://localhost:8000" in ogni funzione — se un giorno il backend
// gira altrove, cambi solo questa riga.
const API_URL = "https://lucapasquarelligithubio.fastapicloud.dev";


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
  const response = await fetch(`${API_URL}/entries/summary`);

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


// --- FUNZIONE 2: inviare una nuova entry al backend ---
//
// "event" è l'oggetto che il browser passa automaticamente alla funzione
// quando l'evento scatta — contiene informazioni su COSA è successo
// (qui: il submit del form) e permette di controllarne il comportamento.
async function handleFormSubmit(event) {

  // Blocca il comportamento di default del form (invio classico + reload
  // della pagina). Senza questa riga, la pagina si ricaricherebbe prima
  // ancora che il nostro fetch() abbia la possibilità di partire.
  event.preventDefault();

  // Leggiamo cosa l'utente ha digitato nei due campi.
  // .value è sempre una stringa, anche per l'input di tipo "number" —
  // per questo convertiamo esplicitamente con parseFloat.
  const ambito = document.getElementById("input-ambito").value;
  const ore = parseFloat(document.getElementById("input-ore").value);
  const apiKey = document.getElementById("input-apikey").value;

  // fetch() per un POST richiede più dettagli di un GET: il metodo,
  // gli header (diciamo al server "il body è JSON"), e il body vero
  // e proprio — che deve essere TESTO, non un oggetto JS diretto,
  // per questo JSON.stringify() lo converte in stringa JSON.
  await fetch(`${API_URL}/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      subject: ambito,
      hours: ore,
      // "data" non la mandiamo: il backend ha un default (oggi) se il
      // campo manca — coerente con il Pydantic model che hai scritto.
    }),
  });

  // Puliamo il form, pronto per un nuovo inserimento.
  document.getElementById("entry-form").reset();

  // Qui la parte che chiedevi: richiamiamo loadSummary() di nuovo.
  // Non c'è aggiornamento "automatico" in JavaScript — se vuoi che la
  // tabella rifletta il nuovo dato, DEVI rieseguire tu la funzione che
  // la popola. Il browser non sa che il database è cambiato.
  loadSummary();
}


// --- Eseguire tutto quando la pagina è pronta ---
document.addEventListener("DOMContentLoaded", () => {
  loadSummary();

  // Colleghiamo la funzione all'evento "submit" del form.
  // Da questo momento, ogni volta che l'utente preme "Salva"
  // (o preme invio dentro un campo del form), handleFormSubmit parte.
  document.getElementById("entry-form").addEventListener("submit", handleFormSubmit);
});