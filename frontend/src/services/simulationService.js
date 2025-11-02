import axios from 'axios';

const API_URL = '/api/simulations';

class SimulationService {
  // Obtenir toutes les simulations
  async getSimulations(params = {}) {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Obtenir une simulation par ID
  async getSimulation(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Créer une nouvelle simulation
  async createSimulation(simulationData) {
    try {
      const response = await axios.post(API_URL, simulationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Mettre à jour une simulation
  async updateSimulation(id, simulationData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, simulationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Supprimer une simulation
  async deleteSimulation(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Dupliquer une simulation
  async duplicateSimulation(id) {
    try {
      const response = await axios.post(`${API_URL}/${id}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Changer le statut d'une simulation
  async changeSimulationStatus(id, status) {
    try {
      const response = await axios.put(`${API_URL}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Obtenir les statistiques
  async getStatistics() {
    try {
      const response = await axios.get(`${API_URL}/stats/summary`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Calculer les résultats financiers d'une simulation (côté client)
  calculateFinancials(simulationData) {
    const {
      typologieBiens = [],
      coutFoncier = 0,
      vrdCout = 10,
      fraisEtudes = 7,
      fraisFinanciers = 3,
      tauxTVA = 18,
      marges = { penetration: 30, target: 60, premium: 80, premiumPlus: 100 }
    } = simulationData;

    let investissementTotal = 0;
    let chiffreAffairesProjete = 0;

    typologieBiens.forEach(bien => {
      const coutTerrain = bien.surfaceTerrain * coutFoncier;
      const coutConstruction = bien.surfaceBati * bien.coutConstruction;
      const coutBase = coutTerrain + coutConstruction;
      const fraisAdditionnels = coutBase * ((vrdCout + fraisEtudes + fraisFinanciers) / 100);
      const coutTotalHT = coutBase + fraisAdditionnels;
      const coutTotalTTC = coutTotalHT * (1 + tauxTVA / 100);

      // Calculer les prix pour chaque niveau de marge
      bien.coutTotal = coutTotalTTC;
      bien.prix = {
        penetration: coutTotalHT * (1 + marges.penetration / 100) * (1 + tauxTVA / 100),
        target: coutTotalHT * (1 + marges.target / 100) * (1 + tauxTVA / 100),
        premium: coutTotalHT * (1 + marges.premium / 100) * (1 + tauxTVA / 100),
        premiumPlus: coutTotalHT * (1 + marges.premiumPlus / 100) * (1 + tauxTVA / 100)
      };

      investissementTotal += coutTotalTTC * bien.quantite;
      // Utilisation du prix cible pour le CA projeté
      chiffreAffairesProjete += bien.prix.target * bien.quantite;
    });

    const margeNette = chiffreAffairesProjete - investissementTotal;
    const roi = investissementTotal > 0 ? (margeNette / investissementTotal) * 100 : 0;

    return {
      investissementTotal,
      chiffreAffairesProjete,
      margeNette,
      roi: Math.round(roi * 100) / 100
    };
  }

  // Préparer les données de simulation pour l'envoi au backend
  prepareSimulationData(formData) {
    // Calculer les résultats financiers
    const financials = this.calculateFinancials(formData);

    // Nettoyer les typologieBiens en retirant les champs 'id' et '_id' temporaires
    const cleanedTypologieBiens = formData.typologieBiens.map(type => {
      const { id, _id, ...typeWithoutIdFields } = type;
      return typeWithoutIdFields;
    });

    // Fusionner avec les données du formulaire
    return {
      ...formData,
      typologieBiens: cleanedTypologieBiens,
      ...financials
    };
  }
}

export default new SimulationService();