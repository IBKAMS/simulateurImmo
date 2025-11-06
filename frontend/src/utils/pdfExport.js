import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

// Fonction pour formater les montants en FCFA
const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(montant || 0);
};

// Fonction pour formater les pourcentages
const formatPourcentage = (valeur) => {
  if (!valeur && valeur !== 0) return '0.0%';
  return `${valeur.toFixed(1)}%`;
};

// Fonction pour formater les nombres
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Fonction pour capturer un graphique spécifique
const captureChart = async (chartId) => {
  try {
    // Chercher le canvas directement
    const element = document.getElementById(chartId);
    if (!element) {
      console.warn(`Graphique ${chartId} non trouvé`);
      return null;
    }

    // Si c'est un canvas, obtenir son contexte et vérifier qu'il a du contenu
    if (element.tagName === 'CANVAS') {
      const ctx = element.getContext('2d');
      if (!ctx) {
        console.warn(`Contexte canvas non disponible pour ${chartId}`);
        return null;
      }
    }

    // Attendre que le graphique soit complètement rendu
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Chercher le conteneur parent avec la classe chart-container
    const chartContainer = element.closest('.chart-container') || element.parentElement;

    if (!chartContainer) {
      console.warn(`Conteneur de graphique non trouvé pour ${chartId}`);
      return null;
    }

    // Utiliser html2canvas avec des paramètres optimisés
    const canvas = await html2canvas(chartContainer, {
      scale: 3, // Augmenter la qualité
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: chartContainer.scrollWidth,
      windowHeight: chartContainer.scrollHeight,
      onclone: (clonedDoc) => {
        // S'assurer que les styles sont appliqués
        const clonedElement = clonedDoc.getElementById(chartId);
        if (clonedElement && clonedElement.tagName === 'CANVAS') {
          // Forcer le rendu du canvas cloné
          const originalCanvas = document.getElementById(chartId);
          if (originalCanvas) {
            const destCtx = clonedElement.getContext('2d');
            destCtx.drawImage(originalCanvas, 0, 0);
          }
        }
      }
    });

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.error(`Erreur lors de la capture du graphique ${chartId}:`, error);
    return null;
  }
};

// Fonction principale pour générer le PDF
export const generatePDF = async (simulationData, results) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yPosition = 20;

  // Configuration des couleurs
  const primaryColor = [41, 128, 185];
  const secondaryColor = [52, 73, 94];
  const accentColor = [46, 204, 113];
  const warningColor = [241, 196, 15];

  // Logo et En-tête
  pdf.setFontSize(24);
  pdf.setTextColor(...primaryColor);
  pdf.text('ALIZ STRATEGY', 105, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(20);
  pdf.text('Rapport de Simulation Immobilière', 105, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setTextColor(...secondaryColor);
  pdf.text(simulationData.nomProjet || 'Projet Immobilier', 105, yPosition, { align: 'center' });
  yPosition += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(simulationData.localisation || 'Localisation non spécifiée', 105, yPosition, { align: 'center' });
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Ligne de séparation
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Section 1: Configuration du Projet
  addSection(pdf, 'Configuration du Projet', yPosition);
  yPosition += 10;

  const configData = [
    ['Nom du projet', simulationData.nomProjet || '-'],
    ['Localisation', simulationData.localisation || '-'],
    ['Type de zone', getZoneLabel(simulationData.typeZone)],
    ['Coefficient de localisation', `x${simulationData.localisationCoefficient || 1}`],
    ['Surface totale terrain', `${formatNumber(simulationData.surfaceTotaleTerrain || 0)} m²`],
    ['Coût foncier/m²', formatMontant(simulationData.coutFoncier || 0)],
    ['Coût foncier total', formatMontant((simulationData.surfaceTotaleTerrain || 0) * (simulationData.coutFoncier || 0))],
    ['Type de titre foncier', getTitreFoncierLabel(simulationData.typeTitreFoncier)],
    ['Nombre de phases', simulationData.nombrePhases || '1'],
    ['Durée totale estimée', simulationData.dureeProjet ? `${simulationData.dureeProjet} mois` : '24 mois'],
    ['Date de démarrage', simulationData.dateDebut ? new Date(simulationData.dateDebut).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')],
    ['Promoteur', simulationData.promoteur || 'ALIZ STRATEGY']
  ];

  pdf.autoTable({
    startY: yPosition,
    head: [['Paramètre', 'Valeur']],
    body: configData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  yPosition = pdf.lastAutoTable.finalY + 10;

  // Section 2: Typologie des Biens
  if (simulationData.typologieBiens && simulationData.typologieBiens.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 20;
    }

    addSection(pdf, 'Typologie des Biens', yPosition);
    yPosition += 10;

    // Calcul des totaux
    const totalQuantite = simulationData.typologieBiens.reduce((sum, b) => sum + (b.quantite || 0), 0);
    const totalSurfaceTerrain = simulationData.typologieBiens.reduce((sum, b) => sum + ((b.surfaceTerrain || 0) * (b.quantite || 0)), 0);
    const totalSurfaceBatie = simulationData.typologieBiens.reduce((sum, b) => sum + ((b.surfaceBati || 0) * (b.quantite || 0)), 0);
    const totalCoutConstruction = simulationData.typologieBiens.reduce((sum, b) => sum + ((b.coutConstruction || 0) * (b.quantite || 0)), 0);

    const biensData = simulationData.typologieBiens.map(bien => [
      bien.nom,
      `${formatNumber(bien.surfaceTerrain)} m²`,
      `${formatNumber(bien.surfaceBati)} m²`,
      formatMontant(bien.coutConstruction),
      formatNumber(bien.quantite),
      formatMontant(bien.coutConstruction * bien.quantite)
    ]);

    // Ajouter la ligne de totaux
    biensData.push([
      'TOTAUX',
      `${formatNumber(totalSurfaceTerrain)} m²`,
      `${formatNumber(totalSurfaceBatie)} m²`,
      '-',
      formatNumber(totalQuantite),
      formatMontant(totalCoutConstruction)
    ]);

    pdf.autoTable({
      startY: yPosition,
      head: [['Type de bien', 'Surface terrain', 'Surface bâtie', 'Coût/unité', 'Quantité', 'Coût total']],
      body: biensData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 },
      // Style pour la ligne de totaux
      willDrawCell: function(data) {
        if (data.row.index === biensData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      }
    });

    yPosition = pdf.lastAutoTable.finalY + 10;
  }

  // Section 3: Structure des Coûts
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 20;
  }

  addSection(pdf, 'Structure des Coûts du Projet', yPosition);
  yPosition += 10;

  const coutFoncierTotal = (simulationData.surfaceTotaleTerrain || 0) * (simulationData.coutFoncier || 0);
  const vrdTotal = coutFoncierTotal * ((simulationData.vrdCout || 0) / 100);
  const fraisEtudesTotal = results?.coutTotalProjet * ((simulationData.fraisEtudes || 0) / 100);
  const fraisFinanciersTotal = results?.coutTotalProjet * ((simulationData.fraisFinanciers || 0) / 100);
  const tvaTotal = results?.coutTotalProjet * ((simulationData.tauxTVA || 0) / 100);
  const fraisCommTotal = results?.chiffreAffaires * ((simulationData.fraisComm || 0) / 100);

  const coutsData = [
    ['Coût foncier', '-', formatMontant(coutFoncierTotal)],
    ['VRD (Voirie et Réseaux Divers)', `${simulationData.vrdCout || 0}%`, formatMontant(vrdTotal)],
    ['Frais d\'études et honoraires', `${simulationData.fraisEtudes || 0}%`, formatMontant(fraisEtudesTotal)],
    ['Frais financiers', `${simulationData.fraisFinanciers || 0}%`, formatMontant(fraisFinanciersTotal)],
    ['TVA', `${simulationData.tauxTVA || 0}%`, formatMontant(tvaTotal)],
    ['Frais de commercialisation', `${simulationData.fraisComm || 0}%`, formatMontant(fraisCommTotal)],
    ['COÛT TOTAL DU PROJET', '-', formatMontant(results?.coutTotalProjet || 0)]
  ];

  pdf.autoTable({
    startY: yPosition,
    head: [['Type de coût', 'Taux appliqué', 'Montant']],
    body: coutsData,
    theme: 'grid',
    headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 9, cellPadding: 3 },
    willDrawCell: function(data) {
      if (data.row.index === coutsData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 230, 230];
      }
    }
  });

  yPosition = pdf.lastAutoTable.finalY + 10;

  // Section 4: Stratégie de Prix
  if (simulationData.strategiePrix) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 20;
    }

    addSection(pdf, 'Stratégie de Prix et Marges', yPosition);
    yPosition += 10;

    // Marges générales si disponibles
    if (simulationData.customMargins) {
      pdf.setFontSize(11);
      pdf.setTextColor(...secondaryColor);
      pdf.text('Marges générales du projet:', 20, yPosition);
      yPosition += 7;

      const margesGenerales = [
        ['Marge minimale', formatPourcentage(simulationData.customMargins.margeMin)],
        ['Marge maximale', formatPourcentage(simulationData.customMargins.margeMax)],
        ['Marge cible', formatPourcentage(simulationData.customMargins.margeCible)]
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [['Paramètre', 'Valeur']],
        body: margesGenerales,
        theme: 'grid',
        headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
    }

    // Marges par type de bien
    const { customMarginsByType } = simulationData.strategiePrix || {};

    if (customMarginsByType && Object.keys(customMarginsByType).length > 0) {
      pdf.setFontSize(11);
      pdf.setTextColor(...secondaryColor);
      pdf.text('Marges personnalisées par type de bien:', 20, yPosition);
      yPosition += 7;

      const margesData = Object.entries(customMarginsByType).map(([type, marges]) => [
        type,
        formatPourcentage(marges.margeMin),
        formatPourcentage(marges.margeMax),
        formatPourcentage(marges.margeCible)
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Type de bien', 'Marge Min', 'Marge Max', 'Marge Cible']],
        body: margesData,
        theme: 'grid',
        headStyles: { fillColor: accentColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
    }
  }

  // Section 5: Phasage du Projet (si disponible)
  if (simulationData.phasage && simulationData.phasage.phases && simulationData.phasage.phases.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 20;
    }

    addSection(pdf, 'Phasage du Projet', yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.text(`Durée totale du projet: ${simulationData.phasage.duree || 24} mois`, 20, yPosition);
    yPosition += 7;

    const phasageData = simulationData.phasage.phases.map(phase => [
      phase.nom,
      `${phase.duree} mois`,
      formatPourcentage(phase.pourcentage),
      phase.description || '-'
    ]);

    pdf.autoTable({
      startY: yPosition,
      head: [['Phase', 'Durée', 'Pourcentage', 'Description']],
      body: phasageData,
      theme: 'grid',
      headStyles: { fillColor: warningColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    yPosition = pdf.lastAutoTable.finalY + 10;
  }

  // Section 6: Analyse Comparative et Benchmarking
  if (simulationData.benchmarking || simulationData.concurrents) {
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }

    addSection(pdf, 'Analyse Comparative et Benchmarking', yPosition);
    yPosition += 10;

    if (simulationData.benchmarking) {
      const benchData = [
        ['Prix concurrent moyen', formatMontant(simulationData.benchmarking.prixConcurrent || 0)],
        ['Prix marché moyen', formatMontant(simulationData.benchmarking.prixMarche || 0)],
        ['Notre prix moyen/m²', formatMontant(results?.prixMoyenM2 || 0)],
        ['Écart vs marché', formatPourcentage(((results?.prixMoyenM2 || 0) - (simulationData.benchmarking.prixMarche || 1)) / (simulationData.benchmarking.prixMarche || 1) * 100)],
        ['Positionnement', getPositionnement(results?.prixMoyenM2, simulationData.benchmarking.prixMarche)]
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [['Critère', 'Valeur']],
        body: benchData,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
    }

    // Analyse des concurrents
    if (simulationData.concurrents && simulationData.concurrents.length > 0) {
      pdf.setFontSize(11);
      pdf.setTextColor(...secondaryColor);
      pdf.text('Analyse concurrentielle:', 20, yPosition);
      yPosition += 7;

      const concurrentsData = simulationData.concurrents.map(concurrent => [
        concurrent.nom,
        formatMontant(concurrent.prix),
        concurrent.localisation || '-',
        formatPourcentage(((concurrent.prix - (results?.prixMoyenM2 || 0)) / (results?.prixMoyenM2 || 1)) * 100)
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Concurrent', 'Prix/m²', 'Localisation', 'Écart vs Notre Prix']],
        body: concurrentsData,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9, cellPadding: 3 }
      });

      yPosition = pdf.lastAutoTable.finalY + 10;
    }
  }

  // Section 7: Analyse de Marché et Positionnement
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }

  addSection(pdf, 'Analyse de Marché et Positionnement Concurrentiel', yPosition);
  yPosition += 10;

  // Données de benchmarking si disponibles
  if (simulationData.benchmarking) {
    const benchData = [
      ['Prix marché moyen/m²', formatMontant(simulationData.benchmarking.prixMarche || 0)],
      ['Prix projet/m²', formatMontant(results?.prixMoyenM2 || 0)],
      ['Écart par rapport au marché', `${((((results?.prixMoyenM2 || 0) - (simulationData.benchmarking.prixMarche || 0)) / (simulationData.benchmarking.prixMarche || 1)) * 100).toFixed(1)}%`],
      ['Délai de vente moyen marché', `${simulationData.benchmarking.delaiVente || 12} mois`],
      ['Taux d\'absorption prévu', `${simulationData.benchmarking.tauxAbsorption || 75}%`],
      ['Note concurrence (1-5)', `${simulationData.benchmarking.noteConcurrence || 3}/5`]
    ];

    pdf.autoTable({
      startY: yPosition,
      head: [['Indicateur', 'Valeur']],
      body: benchData,
      theme: 'grid',
      headStyles: { fillColor: secondaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;
  }

  // Section 8: Résultats Financiers Détaillés
  if (yPosition > 200) {
    pdf.addPage();
    yPosition = 20;
  }

  addSection(pdf, 'Résultats Financiers et Indicateurs de Performance', yPosition);
  yPosition += 10;

  // Tableau principal des résultats
  const resultatsData = [
    ['Investissement initial', formatMontant(results?.coutTotalProjet || 0)],
    ['Chiffre d\'affaires prévisionnel', formatMontant(results?.chiffreAffaires || 0)],
    ['Marge brute', formatMontant(results?.margeBrute || 0)],
    ['Marge nette', formatMontant(results?.margeNette || 0)],
    ['Taux de marge brute', formatPourcentage(results?.tauxMargeBrute || 0)],
    ['Taux de marge nette', formatPourcentage(results?.tauxMarge || 0)],
    ['ROI (Retour sur Investissement)', formatPourcentage(results?.roi || 0)],
    ['Prix moyen par m²', formatMontant(results?.prixMoyenM2 || 0)],
    ['Prix moyen par unité', formatMontant(results?.prixMoyenParUnite || 0)],
    ['Durée d\'amortissement estimée', `${Math.round((results?.coutTotalProjet || 0) / ((results?.margeNette || 1) / 12))} mois`],
    ['Rentabilité commerciale', formatPourcentage((results?.margeNette || 0) / (results?.chiffreAffaires || 1) * 100)],
    ['Coefficient multiplicateur', `x${((results?.chiffreAffaires || 0) / (results?.coutTotalProjet || 1)).toFixed(2)}`]
  ];

  pdf.autoTable({
    startY: yPosition,
    head: [['Indicateur', 'Valeur']],
    body: resultatsData,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 4, fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  yPosition = pdf.lastAutoTable.finalY + 15;

  // Section 9: Graphiques
  pdf.addPage();
  yPosition = 20;

  addSection(pdf, 'Visualisations Graphiques', yPosition);
  yPosition += 10;

  // Liste des graphiques à capturer (uniquement ceux qui existent réellement)
  const chartsToCapture = [
    { id: 'costChart', title: 'Répartition des Coûts par Type' },
    { id: 'salesChart', title: 'Évolution des Ventes par Phase' },
    { id: 'competitorChart', title: 'Positionnement Concurrentiel' },
    { id: 'marginChart', title: 'Analyse des Marges et ROI' },
    { id: 'phaseChart', title: 'Répartition du Chiffre d\'Affaires' }
  ];

  let chartsAdded = 0;

  for (const chart of chartsToCapture) {
    try {
      const imgData = await captureChart(chart.id);

      if (imgData) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }

        // Titre du graphique
        pdf.setFontSize(11);
        pdf.setTextColor(...secondaryColor);
        pdf.text(chart.title, 105, yPosition, { align: 'center' });
        yPosition += 5;

        // Ajouter l'image
        pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 60);
        yPosition += 70;
        chartsAdded++;

        // Maximum 3 graphiques par page
        if (chartsAdded % 3 === 0 && chartsAdded < chartsToCapture.length) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    } catch (error) {
      console.error(`Erreur lors de la capture du graphique ${chart.id}:`, error);
    }
  }

  // Section 10: Recommandations et Conclusions
  pdf.addPage();
  yPosition = 20;

  addSection(pdf, 'Recommandations Stratégiques', yPosition);
  yPosition += 10;

  const recommendations = [
    {
      titre: '💡 Optimisation des coûts',
      texte: 'Envisager une négociation avec les fournisseurs pour réduire les coûts de construction de 5-10%.'
    },
    {
      titre: '📈 Stratégie de prix',
      texte: `Avec un ROI de ${formatPourcentage(results?.roi || 0)}, le projet présente une rentabilité ${results?.roi > 20 ? 'excellente' : results?.roi > 10 ? 'satisfaisante' : 'à améliorer'}.`
    },
    {
      titre: '🎯 Positionnement marché',
      texte: `Le prix moyen de ${formatMontant(results?.prixMoyenM2 || 0)}/m² positionne le projet comme ${getPositionnement(results?.prixMoyenM2, simulationData.benchmarking?.prixMarche)}.`
    },
    {
      titre: '⏱️ Phasage optimal',
      texte: 'Privilégier un lancement progressif pour tester le marché et ajuster la stratégie si nécessaire.'
    }
  ];

  recommendations.forEach(rec => {
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.text(rec.titre, 20, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const lines = pdf.splitTextToSize(rec.texte, 170);
    pdf.text(lines, 20, yPosition);
    yPosition += lines.length * 4 + 5;
  });

  // Pied de page sur toutes les pages
  const pageCount = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);

    // Numérotation
    pdf.text(`Page ${i} / ${pageCount}`, 105, 285, { align: 'center' });

    // Footer
    pdf.text('ALIZ STRATEGY - Simulateur Immobilier', 105, 290, { align: 'center' });
    pdf.text('Document confidentiel - Ne pas diffuser', 105, 293, { align: 'center' });

    // Ligne de séparation
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(20, 280, 190, 280);
  }

  // Sauvegarder le PDF
  const fileName = `Simulation_${simulationData.nomProjet || 'Projet'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Fonction auxiliaire pour ajouter une section
const addSection = (pdf, title, yPosition) => {
  pdf.setFontSize(14);
  pdf.setTextColor(41, 128, 185);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, 20, yPosition);
  pdf.setFont(undefined, 'normal');

  // Ligne de séparation
  pdf.setDrawColor(41, 128, 185);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition + 2, 190, yPosition + 2);
};

// Fonctions auxiliaires pour les labels
const getZoneLabel = (zone) => {
  const zones = {
    'strategic': 'Zone stratégique (Premium)',
    'premium': 'Zone premium (Haut de gamme)',
    'standard': 'Zone standard (Milieu de gamme)',
    'economique': 'Zone économique'
  };
  return zones[zone] || zone || 'Non spécifié';
};

const getTitreFoncierLabel = (titre) => {
  const titres = {
    'acd': 'ACD (Arrêté de Concession Définitive)',
    'titre_foncier': 'Titre Foncier',
    'bail': 'Bail Emphytéotique',
    'lettre_attribution': 'Lettre d\'Attribution'
  };
  return titres[titre] || titre || 'Non spécifié';
};

const getPositionnement = (prixProjet, prixMarche) => {
  if (!prixProjet || !prixMarche) return 'Non déterminé';
  const ratio = prixProjet / prixMarche;
  if (ratio < 0.85) return 'Très compétitif (Prix agressif)';
  if (ratio < 0.95) return 'Compétitif';
  if (ratio < 1.05) return 'Dans le marché';
  if (ratio < 1.15) return 'Premium';
  return 'Luxe (Positionnement haut de gamme)';
};