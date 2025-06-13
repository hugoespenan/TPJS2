let panier = JSON.parse(localStorage.getItem("panier")) || [];
let commandes = JSON.parse(localStorage.getItem("commandes")) || [];
const TVA = 0.1;

const menuEl = document.getElementById("menu");
const panierEl = document.getElementById("liste-panier");
const totalEl = document.getElementById("total");
const commanderBtn = document.getElementById("commander");
const recapModal = document.getElementById("recapModal");
const recapEl = document.getElementById("recap");
const validerBtn = document.getElementById("valider");
const annulerBtn = document.getElementById("annuler");
const suiviEl = document.getElementById("suivi-commandes");
const toast = document.getElementById("toast");

loadMenu();
renderPanier();
renderCommandes();

async function loadMenu() {
    const res = await fetch("menu.json");
    const plats = await res.json();
    plats.forEach(p => {
        const div = document.createElement("div");
        div.className = "plat";
        div.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.price.toFixed(2)}€</p>
      <button onclick='ajouterAuPanier(${JSON.stringify(p)})'>Ajouter</button>
    `;
        menuEl.appendChild(div);
    });
}

function ajouterAuPanier(plat) {
    const item = panier.find(p => p.id === plat.id);
    if (item) item.qte++;
    else panier.push({ ...plat, qte: 1 });
    savePanier();
    renderPanier();
}

function renderPanier() {
    panierEl.innerHTML = "";
    let total = 0;
    panier.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${p.name} - 
            <input type="number" min="1" value="${p.qte}" data-id="${p.id}" class="quantite-input"> × ${p.price.toFixed(2)}€ = ${(p.qte * p.price).toFixed(2)}€
            <button data-id="${p.id}" class="btn-supprimer">🗑️</button>
        `;
        panierEl.appendChild(li);
        total += p.qte * p.price;
    });
    totalEl.textContent = `Total: ${total.toFixed(2)}€`;

    document.querySelectorAll(".quantite-input").forEach(input => {
        input.addEventListener("change", e => {
            const id = parseInt(input.dataset.id);
            const newQty = parseInt(input.value);
            const item = panier.find(p => p.id === id);
            if (item && newQty >= 1) {
                item.qte = newQty;
            } else {
                panier = panier.filter(p => p.id !== id);
            }
            savePanier();
            renderPanier();
        });
    });

    document.querySelectorAll(".btn-supprimer").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            panier = panier.filter(p => p.id !== id);
            savePanier();
            renderPanier();
        });
    });

    savePanier();
}

commanderBtn.onclick = () => {
    if (panier.length === 0) return;
    const totalHT = panier.reduce((sum, p) => sum + p.qte * p.price, 0);
    const tva = totalHT * TVA;
    const totalTTC = totalHT + tva;
    recapEl.innerHTML = `
    <ul>${panier.map(p => `<li>${p.name} x${p.qte}</li>`).join("")}</ul>
    <p>HT: ${totalHT.toFixed(2)}€</p>
    <p>TVA: ${tva.toFixed(2)}€</p>
    <p><strong>TTC: ${totalTTC.toFixed(2)}€</strong></p>
  `;
    recapModal.classList.remove("hidden");
};

annulerBtn.onclick = () => recapModal.classList.add("hidden");

validerBtn.onclick = async () => {
    if (commandes.length >= 5) return showToast("Maximum de 5 commandes atteint");
    const id = Date.now();
    const nouvelleCommande = { id, etat: 0, contenu: [...panier] };
    commandes.push(nouvelleCommande);
    saveCommandes();
    renderCommandes();
    panier = [];
    savePanier();
    renderPanier();
    recapModal.classList.add("hidden");
    showToast("Commande validée !");
    suivreCommande(id);
};

function renderCommandes() {
    suiviEl.innerHTML = "";
    commandes.forEach(cmd => {
        const div = document.createElement("div");
        div.textContent = `Commande #${cmd.id} - ${etatCommande(cmd.etat)}`;
        if (cmd.etat === 0) {
            const btn = document.createElement("button");
            btn.textContent = "Annuler";
            btn.onclick = () => annulerCommande(cmd.id);
            div.appendChild(btn);
        }
        suiviEl.appendChild(div);
    });
}

function etatCommande(etat) {
    return ["Préparation", "En livraison", "Livré"][etat];
}

function annulerCommande(id) {
    commandes = commandes.filter(c => c.id !== id);
    saveCommandes();
    renderCommandes();
    showToast("Commande annulée");
}

async function suivreCommande(id) {
    for (let i = 1; i <= 2; i++) {
        await new Promise(res => setTimeout(res, 2000));
        const cmd = commandes.find(c => c.id === id);
        if (cmd) cmd.etat = i;
        saveCommandes();
        renderCommandes();
    }
}

function showToast(msg) {
    toast.textContent = msg;
    toast.className = "toast";
    setTimeout(() => toast.textContent = "", 3000);
}

function savePanier() {
    localStorage.setItem("panier", JSON.stringify(panier));
}
function saveCommandes() {
    localStorage.setItem("commandes", JSON.stringify(commandes));
}
