/**
 * parts_bin.js - Dynamic Bill of Materials (BOM) & Component Inventory
 * Displays high-fidelity visual cards and pinout diagrams for required parts.
 */

export class PartsBinManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.components = [];
    this.collectedItems = new Set();
  }

  render(componentsList) {
    this.components = componentsList || [];
    this.collectedItems.clear();

    if (!this.container) return;

    if (this.components.length === 0) {
      this.container.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: #71717a; font-size: 13px;">
          No components required for this challenge.
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.components
      .map((item, idx) => {
        const svgIcon = this._getComponentSVG(item.type, item.name, item.image_id);
        return `
          <div class="part-card" data-index="${idx}" id="partCard_${idx}" onclick="window.circuitsLabInstance?.togglePartCollected(${idx})">
            <span class="part-qty-badge">x${item.quantity || 1}</span>
            <div class="part-thumbnail-box">
              ${svgIcon}
            </div>
            <div class="part-meta">
              <div class="part-name" title="${this._escape(item.name)}">${this._escape(item.name)}</div>
              <div class="part-value">${this._escape(item.value || item.package || "")}</div>
              <div class="part-pinout-note" title="${this._escape(item.pinout || "")}">
                📌 ${this._escape(item.pinout || "Standard orientation")}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  toggleCollected(index) {
    const card = document.getElementById(`partCard_${index}`);
    if (!card) return;

    if (this.collectedItems.has(index)) {
      this.collectedItems.delete(index);
      card.classList.remove("collected");
    } else {
      this.collectedItems.add(index);
      card.classList.add("collected");
    }
  }

  _getComponentSVG(type = "", name = "", imageId = "") {
    const t = (type + " " + name + " " + imageId).toLowerCase();

    // 1. DIP IC
    if (t.includes("ic") || t.includes("dip") || t.includes("555") || t.includes("74")) {
      return `
        <svg viewBox="0 0 64 64" fill="none">
          <rect x="16" y="10" width="32" height="44" rx="3" fill="#1c1917" stroke="#44403c" stroke-width="2"/>
          <path d="M28 10 A4 4 0 0 0 36 10" fill="#0c0a09"/>
          <!-- Left pins -->
          <rect x="8" y="14" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="8" y="24" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="8" y="34" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="8" y="44" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <!-- Right pins -->
          <rect x="48" y="14" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="48" y="24" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="48" y="34" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <rect x="48" y="44" width="8" height="4" rx="1" fill="#a1a1aa"/>
          <circle cx="22" cy="16" r="1.5" fill="#71717a"/>
          <text x="32" y="34" font-size="7" fill="#d4d4d8" font-family="monospace" text-anchor="middle" font-weight="bold">CHIP</text>
        </svg>
      `;
    }

    // 2. LED
    if (t.includes("led")) {
      const color = t.includes("green") ? "#10b981" : t.includes("yellow") ? "#eab308" : "#ef4444";
      return `
        <svg viewBox="0 0 64 64" fill="none">
          <!-- Legs -->
          <line x1="28" y1="36" x2="28" y2="56" stroke="#a1a1aa" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="36" y1="36" x2="36" y2="52" stroke="#a1a1aa" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Dome -->
          <path d="M22 34 L22 22 A10 10 0 0 1 42 22 L42 34 Z" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="2"/>
          <ellipse cx="32" cy="34" rx="11" ry="3" fill="${color}"/>
          <!-- Rays -->
          <line x1="44" y1="18" x2="52" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
          <line x1="46" y1="26" x2="54" y2="24" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }

    // 3. Resistor
    if (t.includes("resistor")) {
      return `
        <svg viewBox="0 0 64 64" fill="none">
          <line x1="6" y1="32" x2="20" y2="32" stroke="#a1a1aa" stroke-width="2.5"/>
          <line x1="44" y1="32" x2="58" y2="32" stroke="#a1a1aa" stroke-width="2.5"/>
          <!-- Ceramic Body -->
          <rect x="20" y="24" width="24" height="16" rx="4" fill="#d1b48c" stroke="#a88b5a" stroke-width="1.5"/>
          <!-- Color bands -->
          <rect x="24" y="24" width="3" height="16" fill="#ea580c"/>
          <rect x="30" y="24" width="3" height="16" fill="#ea580c"/>
          <rect x="36" y="24" width="3" height="16" fill="#78350f"/>
          <rect x="41" y="24" width="2" height="16" fill="#eab308"/>
        </svg>
      `;
    }

    // 4. Capacitor
    if (t.includes("cap") || t.includes("capacitor")) {
      return `
        <svg viewBox="0 0 64 64" fill="none">
          <line x1="28" y1="38" x2="28" y2="56" stroke="#a1a1aa" stroke-width="2.5"/>
          <line x1="36" y1="38" x2="36" y2="50" stroke="#a1a1aa" stroke-width="2.5"/>
          <!-- Can -->
          <rect x="22" y="12" width="20" height="28" rx="4" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.5"/>
          <!-- Negative Stripe -->
          <rect x="35" y="12" width="5" height="28" fill="#93c5fd"/>
          <text x="37.5" y="28" font-size="7" fill="#1e3a8a" font-weight="bold" text-anchor="middle">-</text>
        </svg>
      `;
    }

    // 5. Transistor
    if (t.includes("transistor") || t.includes("npn") || t.includes("bjt")) {
      return `
        <svg viewBox="0 0 64 64" fill="none">
          <line x1="26" y1="38" x2="24" y2="54" stroke="#a1a1aa" stroke-width="2"/>
          <line x1="32" y1="38" x2="32" y2="54" stroke="#a1a1aa" stroke-width="2"/>
          <line x1="38" y1="38" x2="40" y2="54" stroke="#a1a1aa" stroke-width="2"/>
          <!-- TO-92 Body -->
          <path d="M22 38 L22 22 A10 10 0 0 1 42 22 L42 38 Z" fill="#1c1917" stroke="#44403c" stroke-width="1.5"/>
          <text x="32" y="32" font-size="5" fill="#a1a1aa" font-family="monospace" text-anchor="middle">3904</text>
        </svg>
      `;
    }

    // Fallback: Jumper wires
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M12 48 C 24 16, 40 16, 52 48" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 52 C 28 24, 38 24, 48 52" stroke="#3b82f6" stroke-width="3" stroke-linecap="round"/>
        <circle cx="12" cy="48" r="2.5" fill="#a1a1aa"/>
        <circle cx="52" cy="48" r="2.5" fill="#a1a1aa"/>
      </svg>
    `;
  }

  _escape(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
