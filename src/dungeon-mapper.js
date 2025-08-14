class DungeonMapper {
  constructor() {
    this.dungeons = {
      // Shadowlands Dungeons
      169: "Iron Docks",
      166: "Grimrail Depot",
      227: "Lower Karazhan",
      234: "Upper Karazhan",
      370: "Mechagon Workshop",
      369: "Mechagon Junkyard",
      378: "Halls of Atonement",
      391: "Streets of Wonder",
      392: "So'leah's Gambit",
      
      // Shadowlands Dungeons (F suffix)
      "227F": "Return to Karazhan: Lower",
      "234F": "Return to Karazhan: Upper",
      "370F": "Operation: Mechagon - Workshop",
      "369F": "Operation: Mechagon - Junkyard",
      "391F": "Tazavesh: Streets of Wonder",
      "392F": "Tazavesh: So'leah's Gambit",
      
      // Dragonflight Dungeons
      399: "Ruby Life Pools",
      400: "The Nokhud Offensive",
      401: "The Azure Vault",
      402: "Algeth'ar Academy",
      210: "Court of Stars",
      200: "Halls of Valor",
      165: "Shadowmoon Burial Grounds",
      2: "Temple of the Jade Serpent",
      
      // Dragonflight Dungeons (F suffix)
      "400F": "The Nokhud Offensive",
      "401F": "The Azure Vault",
      "165F": "Shadowmoon Burial Grounds",
      "2F": "Temple of the Jade Serpent",
      
      // Additional Dragonflight Dungeons
      403: "Uldaman: Legacy of Tyr",
      404: "Neltharus",
      405: "Brackenhide Hollow",
      406: "Halls of Infusion",
      438: "The Vortex Pinnacle",
      206: "Neltharion's Lair",
      245: "Freehold",
      251: "The Underrot",
      
      // Dawn of the Infinite
      "463F": "Dawn of the Infinite: Galakrond's Fall",
      463: "DotI: Galakrond's Fall",
      "464F": "Dawn of the Infinite: Murozond's Rise",
      464: "DotI: Murozond's Rise",
      
      // Additional Legacy Dungeons
      244: "Atal'Dazar",
      248: "Waycrest Manor",
      198: "Darkheart Thicket",
      199: "Black Rook Hold",
      168: "The Everbloom",
      456: "Throne of the Tides",
      
      // The War Within Dungeons
      499: "Priory of the Sacred Flame",
      500: "The Rookery",
      501: "The Stonevault",
      502: "City of Threads",
      503: "Ara-Kara, City of Echoes",
      504: "Darkflame Cleft",
      505: "The Dawnbreaker",
      506: "Cinderbrew Meadery",
      507: "Grim Batol",
      
      // Additional Shadowlands/Other Dungeons
      353: "Siege of Boralus",
      375: "Mists of Tirna Scithe",
      376: "The Necrotic Wake",
      382: "Theater of Pain",
      247: "The MOTHERLODE!!",
      
      // Additional War Within Dungeons
      525: "Operation: Floodgate",
      542: "Eco-Dome Al'dani"
    };
  }

  getDungeonName(id) {
    return this.dungeons[id] || `Unknown Dungeon (${id})`;
  }

  getAllDungeons() {
    return this.dungeons;
  }
}

module.exports = DungeonMapper;
