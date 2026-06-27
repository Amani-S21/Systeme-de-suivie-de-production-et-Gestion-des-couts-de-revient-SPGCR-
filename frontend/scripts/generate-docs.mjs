import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { jsPDF } from 'jspdf'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDirectory = path.resolve(dirname, '../public/docs')

const documents = [
  {
    filename: 'confidentialite.pdf',
    title: 'Politique de confidentialité',
    subtitle: 'Protection des données et règles de traitement du système SPCR',
    sections: [
      ['1. Objet et périmètre', [
        'La présente politique décrit la manière dont SPCR collecte, utilise, protège, conserve et supprime les informations nécessaires au suivi de la production industrielle et au calcul des coûts de revient.',
        'Elle s’applique à tous les utilisateurs autorisés, aux administrateurs, aux responsables de production, aux opérateurs d’usine ainsi qu’aux personnes chargées de la maintenance technique ou du contrôle interne.',
      ]],
      ['2. Catégories de données traitées', [
        'Le système traite les données d’identification des comptes, notamment le nom, le prénom, l’adresse électronique, le nom d’utilisateur, le rôle, l’état d’activation et les dates liées au compte.',
        'Les données industrielles comprennent les matières premières, les mouvements de stock, les produits finis, les nomenclatures BOM, les lots de production, les quantités, les charges, les coûts calculés et les rapports générés.',
        'Les journaux techniques peuvent contenir la date, l’heure, le type d’action, l’utilisateur concerné, l’adresse technique de connexion et les informations nécessaires au diagnostic d’un incident.',
      ]],
      ['3. Finalités du traitement', [
        'Les informations sont utilisées pour authentifier les utilisateurs, appliquer les rôles et permissions, assurer la traçabilité des opérations, suivre la transformation des matières premières et établir le coût de revient.',
        'Elles servent également à produire des indicateurs fiables, préparer les audits, détecter les anomalies, sécuriser les accès et faciliter la continuité des activités de production.',
      ]],
      ['4. Principes de protection', [
        'SPCR applique les principes de finalité déterminée, de minimisation, d’exactitude, de limitation de conservation, de confidentialité et de responsabilité. Chaque donnée doit être pertinente au regard d’une opération métier identifiable.',
        'Les utilisateurs doivent vérifier les informations saisies avant validation. Toute erreur découverte doit être corrigée rapidement afin de préserver l’exactitude des stocks, des coûts et des rapports.',
      ]],
      ['5. Gestion des accès', [
        'L’administrateur dispose des droits de configuration, de gestion des comptes et de supervision. Le responsable de production gère les données industrielles relevant de son activité. L’opérateur accède uniquement aux opérations et lots qui lui sont autorisés.',
        'Un compte est strictement personnel. Le partage de mot de passe, l’utilisation du compte d’un tiers et le contournement des permissions sont interdits. Les comptes inactifs ou en attente ne doivent pas accéder aux fonctions protégées.',
      ]],
      ['6. Authentification et mots de passe', [
        'Les mots de passe sont transmis uniquement par un canal sécurisé et conservés sous forme de condensat cryptographique. Le mot de passe en clair n’est pas stocké dans la base de données.',
        'L’utilisateur doit choisir un secret robuste, éviter sa réutilisation sur d’autres services et signaler immédiatement toute suspicion de compromission. Une session doit être fermée à la fin de l’utilisation d’un poste partagé.',
      ]],
      ['7. Journalisation et traçabilité', [
        'Les actions sensibles peuvent être journalisées afin d’identifier leur auteur, leur date et leur contexte. Ces traces permettent de contrôler les modifications, d’analyser un incident et d’établir la chronologie d’une opération.',
        'Les journaux ne doivent pas être modifiés ou supprimés en dehors d’une procédure administrative autorisée. Leur consultation est limitée aux personnes ayant un besoin de contrôle ou de support.',
      ]],
      ['8. Conservation des informations', [
        'Les durées de conservation dépendent de la nature des données, des obligations de gestion, des besoins d’audit et de la durée de vie des opérations industrielles concernées.',
        'À l’expiration de la durée utile, les informations sont supprimées, anonymisées ou archivées dans un environnement protégé. Une sauvegarde peut conserver temporairement une copie jusqu’à l’expiration de son propre cycle de rotation.',
      ]],
      ['9. Sauvegardes et continuité', [
        'La base PostgreSQL doit faire l’objet de sauvegardes régulières, contrôlées et restaurables. Les copies doivent être protégées contre les accès non autorisés, la perte, l’altération et la suppression accidentelle.',
        'Les procédures de reprise sont testées périodiquement. Une restauration ne doit être effectuée que par une personne habilitée et doit être documentée dans le journal d’exploitation.',
      ]],
      ['10. Exportations et rapports', [
        'Les fichiers PDF et CSV générés par SPCR peuvent contenir des informations internes. Leur destinataire doit être autorisé et leur diffusion doit rester limitée à la finalité professionnelle prévue.',
        'L’utilisateur est responsable du stockage, de l’impression et de la transmission des documents exportés. Un rapport devenu inutile doit être supprimé des postes, supports amovibles et espaces de partage.',
      ]],
      ['11. Sécurité des échanges', [
        'Les échanges entre l’interface React et l’API FastAPI doivent utiliser un canal protégé en environnement de production. Les jetons d’accès ne doivent pas être inscrits dans un document, un message public ou un dépôt de code.',
        'Les secrets de configuration sont conservés dans les fichiers d’environnement exclus du contrôle de version. Les exemples de configuration ne doivent contenir aucune valeur réelle.',
      ]],
      ['12. Incidents de sécurité', [
        'Tout accès suspect, perte de document, modification inexpliquée, divulgation ou indisponibilité importante doit être signalé sans délai à l’administrateur du système.',
        'L’incident est qualifié, contenu, documenté et corrigé. Les mots de passe ou jetons concernés sont renouvelés et les traces disponibles sont préservées pour l’analyse.',
      ]],
      ['13. Droits et demandes', [
        'Une personne concernée peut demander la consultation ou la correction de ses informations d’identification, sous réserve de la vérification de son identité et des obligations de traçabilité applicables.',
        'Les demandes sont adressées à l’administration SPCR. Une suppression peut être refusée lorsque la conservation est nécessaire à la sécurité, à l’audit ou à l’intégrité d’une opération de production.',
      ]],
      ['14. Responsabilités des utilisateurs', [
        'Chaque utilisateur protège son poste, verrouille sa session en cas d’absence, respecte son périmètre d’autorisation et évite d’introduire des données confidentielles dans des champs non prévus à cet effet.',
        'Toute extraction, photographie d’écran ou impression doit répondre à un besoin professionnel légitime. Les informations ne doivent pas être publiées sur des services personnels ou accessibles au public.',
      ]],
      ['15. Mise à jour de la politique', [
        'Cette politique peut évoluer afin de tenir compte des changements fonctionnels, techniques ou organisationnels. La version disponible dans le pied de page de l’application constitue la version de référence.',
        'Dernière révision : 22 juin 2026. Pour toute question, utiliser les coordonnées de contact affichées sur la plateforme SPCR.',
      ]],
    ],
  },
  {
    filename: 'conditions-acces.pdf',
    title: "Conditions d'accès et d'utilisation",
    subtitle: 'Règles applicables aux comptes, aux rôles et aux opérations SPCR',
    sections: [
      ['1. Acceptation des conditions', [
        'L’accès à SPCR implique l’acceptation des présentes conditions. L’utilisateur reconnaît utiliser un outil professionnel destiné au suivi de production, à la gestion des stocks et au calcul des coûts de revient.',
        'Toute personne qui ne peut pas respecter ces règles doit s’abstenir d’utiliser la plateforme et contacter l’administrateur.',
      ]],
      ['2. Éligibilité et création du compte', [
        'Seul l’administrateur peut créer un compte utilisateur. Les informations fournies doivent être exactes, complètes et liées à une personne clairement identifiée.',
        'Un compte nouvellement créé reste en attente jusqu’à sa validation. L’attribution d’un rôle dépend des responsabilités professionnelles réelles de l’utilisateur.',
      ]],
      ['3. Identifiants de connexion', [
        'La connexion s’effectue au moyen d’un nom d’utilisateur et d’un mot de passe. Ces identifiants sont personnels et ne peuvent pas être prêtés, vendus, partagés ou enregistrés sur un support non protégé.',
        'L’utilisateur demeure responsable des actions réalisées depuis son compte jusqu’au signalement d’une compromission et à la désactivation effective de l’accès.',
      ]],
      ['4. Rôle administrateur', [
        'L’administrateur supervise la plateforme, les utilisateurs, les permissions, les paramètres, les rapports et les fonctions de contrôle. Il doit utiliser ses privilèges uniquement pour les besoins du service.',
        'Toute activation, désactivation, suppression ou modification de rôle doit reposer sur une justification organisationnelle vérifiable.',
      ]],
      ['5. Rôle responsable de production', [
        'Le responsable de production peut gérer les matières, produits, nomenclatures, charges, lots et analyses autorisés. Il veille à la cohérence entre les opérations physiques et les données enregistrées.',
        'Il ne doit pas accéder aux fonctions réservées à l’administration ni tenter de modifier les comptes en dehors de son périmètre.',
      ]],
      ['6. Rôle opérateur d’usine', [
        'L’opérateur consulte et traite les lots qui lui sont affectés. Il enregistre les quantités et statuts conformément aux opérations réellement exécutées.',
        'Les données financières, les comptes utilisateurs et les paramètres administratifs ne font pas partie de son périmètre sauf autorisation explicite intégrée au système.',
      ]],
      ['7. Qualité des saisies', [
        'Toute quantité, date, référence, charge, recette BOM ou mouvement de stock doit correspondre à une opération réelle. Les données fictives, approximatives ou volontairement trompeuses sont interdites.',
        'Avant validation, l’utilisateur vérifie les unités, les montants et le produit concerné. Une correction doit préserver la traçabilité de la valeur précédente lorsque cette information est requise.',
      ]],
      ['8. Cycle de production', [
        'Un lot doit être associé à un produit valide et, lorsqu’elle est requise, à une recette BOM. Son ouverture, son affectation, sa mise en cours et sa clôture doivent suivre l’ordre réel du processus industriel.',
        'La clôture confirme les quantités et déclenche les calculs applicables. Une opération clôturée ne doit pas être altérée sans procédure de correction autorisée.',
      ]],
      ['9. Stocks et matières premières', [
        'Les entrées, sorties et ajustements de stock doivent être justifiés. Il est interdit de masquer une rupture, de créer un mouvement artificiel ou de modifier un coût dans le but de fausser les indicateurs.',
        'Les seuils d’alerte sont des outils d’aide à la décision et ne remplacent pas les contrôles physiques périodiques.',
      ]],
      ['10. Charges et coûts de revient', [
        'Les charges directes et indirectes sont enregistrées dans la catégorie appropriée, avec une date et un montant vérifiables. Les doublons doivent être évités.',
        'Le coût calculé dépend de la qualité des stocks, recettes, quantités et charges. Un résultat doit être analysé avant toute décision importante ou diffusion externe.',
      ]],
      ['11. Rapports et exportations', [
        'Les rapports PDF et CSV sont destinés à un usage professionnel autorisé. Ils peuvent être imprimés ou ouverts dans un tableur, sous la responsabilité de la personne qui les exporte.',
        'Il est interdit de modifier un rapport puis de le présenter comme une extraction originale du système. La date et le code du rapport facilitent les contrôles.',
      ]],
      ['12. Usages interdits', [
        'Sont notamment interdits : l’accès au compte d’un tiers, le contournement des permissions, l’extraction massive sans besoin légitime, l’introduction de code malveillant, la saturation volontaire du service et la suppression non autorisée de données.',
        'Toute tentative de compromettre l’API, la base PostgreSQL, les sauvegardes ou les fichiers de configuration peut entraîner la suspension immédiate du compte.',
      ]],
      ['13. Disponibilité et maintenance', [
        'La plateforme peut être interrompue pour maintenance, migration, sauvegarde ou correction d’un incident. Les utilisateurs doivent terminer ou reporter les opérations sensibles lorsqu’une maintenance est annoncée.',
        'Aucune disponibilité absolue n’est garantie. Les responsables organisent les procédures temporaires nécessaires à la continuité de la production.',
      ]],
      ['14. Contrôle et audit', [
        'Les actions peuvent être contrôlées à partir des journaux, des rapports et des enregistrements de la base. L’utilisateur accepte ces contrôles lorsqu’ils poursuivent un objectif de sécurité, de qualité ou d’audit.',
        'Une anomalie peut donner lieu à une demande d’explication et à une vérification des pièces justificatives.',
      ]],
      ['15. Suspension et retrait d’accès', [
        'Un compte peut être désactivé en cas de départ, changement de fonction, inactivité prolongée, risque de sécurité ou non-respect des présentes conditions.',
        'La suspension protège le système et ne supprime pas automatiquement les traces des opérations déjà réalisées.',
      ]],
      ['16. Assistance et responsabilité', [
        'L’utilisateur signale les erreurs fonctionnelles avec les informations nécessaires à leur reproduction, sans transmettre son mot de passe. L’équipe technique traite les demandes selon leur priorité et leur impact.',
        'Dernière révision : 22 juin 2026. Les coordonnées d’assistance sont disponibles dans la section Contact de SPCR.',
      ]],
    ],
  },
  {
    filename: 'documentation.pdf',
    title: 'Documentation fonctionnelle et technique',
    subtitle: 'Guide d’exploitation de la plateforme SPCR',
    sections: [
      ['1. Présentation générale', [
        'SPCR est un outil de suivi de production et de gestion des coûts de revient. Il accompagne la transformation des matières premières en produits finis et centralise les données nécessaires au pilotage industriel.',
        'La plateforme couvre les comptes, matières, stocks, produits, recettes BOM, lots, charges, calculs, tableaux de bord et exports.',
      ]],
      ['2. Architecture', [
        'Le frontend est une application React construite avec Vite. Il fournit les pages responsives, les formulaires, les graphiques, les tableaux et les exports exécutés dans le navigateur.',
        'Le backend est une API FastAPI structurée en modèles, schémas, services et routes. SQLAlchemy gère les accès à PostgreSQL et Alembic applique les migrations de structure.',
      ]],
      ['3. Configuration', [
        'Les paramètres réels sont conservés dans les fichiers .env exclus de Git. Ils comprennent la connexion PostgreSQL, la clé de sécurité, la durée des jetons, les origines CORS et les identifiants de l’administrateur initial.',
        'Les fichiers .env.example ou .example.env décrivent les variables attendues sans exposer de secret réel.',
      ]],
      ['4. Installation du backend', [
        'Créer un environnement Python, installer backend/requirements.txt, vérifier PostgreSQL puis se placer dans le dossier backend.',
        'Exécuter alembic upgrade head pour créer ou mettre à jour les tables. Lancer ensuite uvicorn app.main:app --reload. La documentation interactive est disponible sous /docs.',
      ]],
      ['5. Installation du frontend', [
        'Se placer dans frontend, exécuter npm install puis npm run dev. Vite affiche l’adresse locale utilisée, généralement http://localhost:5173.',
        'La variable VITE_API_URL doit pointer vers le préfixe de l’API FastAPI. Après une modification importante, npm run build vérifie TypeScript et produit la version optimisée.',
      ]],
      ['6. Administrateur initial', [
        'Au démarrage de FastAPI, le service vérifie l’existence du compte administrateur configuré. S’il n’existe pas, il est créé automatiquement; s’il existe, son rôle administratif est préservé.',
        'Le mot de passe doit être modifié et protégé selon les règles de sécurité de l’organisation.',
      ]],
      ['7. Connexion et session', [
        'L’utilisateur saisit son nom d’utilisateur et son mot de passe. FastAPI vérifie les informations puis délivre un jeton utilisé par React pour les appels protégés.',
        'Un compte en attente ne peut pas utiliser le tableau de bord. La déconnexion supprime les informations de session présentes dans le navigateur.',
      ]],
      ['8. Rôles et permissions', [
        'L’administrateur accède à toutes les fonctions. Le responsable de production gère les opérations industrielles et financières autorisées. L’opérateur dispose d’un tableau de bord centré sur ses lots.',
        'Les contrôles sont appliqués dans React pour l’ergonomie et dans FastAPI pour la sécurité. Une URL saisie directement ne contourne pas une permission backend.',
      ]],
      ['9. Tableau de bord', [
        'Le tableau de bord présente les quantités produites, les coûts, les marges, l’évolution mensuelle, la répartition des coûts, les statuts de lots et les dernières productions.',
        'Le filtre de dates recharge les statistiques pour la période sélectionnée. L’administrateur dispose en plus du graphique des comptes actifs et en attente.',
      ]],
      ['10. Matières et stocks', [
        'Une matière possède un code, un nom, une unité, une quantité, un coût unitaire et un seuil minimal. Les entrées de stock mettent à jour la quantité et peuvent recalculer le coût moyen pondéré.',
        'Les filtres facilitent la recherche et les alertes signalent les quantités inférieures ou égales au seuil.',
      ]],
      ['11. Catalogue des produits', [
        'Un produit fini possède une désignation, un SKU automatique, une unité commerciale et un prix de vente. Le SKU généré est non modifiable afin de préserver son unicité.',
        'Les actions Voir, Modifier et Supprimer ouvrent des fenêtres dédiées. Une suppression peut être refusée lorsqu’un produit est déjà utilisé.',
      ]],
      ['12. Nomenclatures BOM', [
        'La nomenclature associe un produit aux matières nécessaires et à leur quantité standard. Elle constitue la recette de référence utilisée pour préparer et analyser la production.',
        'Le parcours guidé permet de créer le produit, sélectionner les composants, saisir les quantités puis valider la recette.',
      ]],
      ['13. Lots de production', [
        'L’ouverture d’un lot sélectionne un produit, une quantité et un opérateur actif. FastAPI génère une référence unique et enregistre l’auteur, la date et le statut initial.',
        'L’opérateur voit les lots qui lui sont affectés. La clôture enregistre la fin de production et permet le calcul des coûts associés.',
      ]],
      ['14. Charges', [
        'La page Charges gère la main-d’œuvre, l’énergie, le transport, la maintenance, l’administration et les autres frais. Chaque charge comprend un libellé, une catégorie, un montant, une date et une description facultative.',
        'Les filtres par texte, catégorie et période s’appliquent à la liste et aux exports.',
      ]],
      ['15. Calcul du coût de revient', [
        'Le coût de revient agrège les matières consommées, la main-d’œuvre, les charges indirectes et les autres coûts applicables. Le coût unitaire dépend également de la quantité produite.',
        'Les résultats alimentent les analyses et rapports. Une valeur nulle signifie généralement qu’aucune donnée correspondante n’a encore été enregistrée.',
      ]],
      ['16. Rapports PDF', [
        'Chaque export PDF utilise le même modèle officiel : en-tête SPCR, titre, code du rapport, date de génération, tableau paginé, totaux pertinents et pied de page numéroté.',
        'Les exports lancés depuis les pages Stocks, Lots, Produits, Charges, Analyses, Utilisateurs, Historique et Succursales utilisent les lignes filtrées de leur page.',
      ]],
      ['17. Exports CSV', [
        'Les exports tableur sont générés au format CSV UTF-8 avec séparateur point-virgule. La première ligne sep=; facilite l’ouverture directe dans Excel selon les paramètres régionaux francophones.',
        'Les valeurs susceptibles d’être interprétées comme des formules sont neutralisées afin de réduire les risques lors de l’ouverture du fichier.',
      ]],
      ['18. Migrations Alembic', [
        'Toute évolution de la structure PostgreSQL doit être décrite par une migration versionnée. La commande alembic current indique la version appliquée et alembic upgrade head applique les versions manquantes.',
        'Une sauvegarde est recommandée avant une migration importante sur une base contenant des données de production.',
      ]],
      ['19. API et erreurs', [
        'FastAPI valide les payloads avec Pydantic. Une réponse 422 indique qu’un champ est absent, invalide ou incompatible avec une règle métier. Une réponse 401 concerne l’authentification et une réponse 403 les permissions.',
        'L’interface affiche une notification de succès ou d’échec pendant cinq secondes. Les formulaires réinitialisent leur état de chargement même lorsqu’une requête échoue.',
      ]],
      ['20. Sauvegarde et maintenance', [
        'Les sauvegardes PostgreSQL, la rotation des journaux, la surveillance de l’espace disque et la vérification des migrations font partie de la maintenance régulière.',
        'Après une mise à jour, vérifier la connexion, les rôles, la création d’un lot, les calculs, les exports et le rendu responsive sur ordinateur et mobile.',
      ]],
      ['21. Dépannage rapide', [
        'Si le frontend ne démarre pas, exécuter npm install et contrôler la configuration PostCSS/Vite. Si l’API ne démarre pas, vérifier le port, les dépendances Python, le fichier .env et la disponibilité de PostgreSQL.',
        'En cas d’erreur de migration, lire la trace complète, vérifier DATABASE_URL et confirmer que la base ciblée existe et accepte la connexion.',
      ]],
      ['22. Glossaire', [
        'BOM : nomenclature ou recette standard. CUMP : coût unitaire moyen pondéré. Lot : ordre de production identifié. KPI : indicateur clé. API : interface utilisée par React pour communiquer avec FastAPI.',
        'Dernière révision : 22 juin 2026. Cette documentation doit évoluer avec les fonctionnalités et migrations futures de SPCR.',
      ]],
    ],
  },
]

function generatePdf(definition) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const left = 17
  const right = 17
  const bottom = 278
  const textWidth = pageWidth - left - right
  let y = 0

  const drawPageHeader = (firstPage = false) => {
    doc.setFillColor(8, 32, 68)
    doc.rect(0, 0, pageWidth, firstPage ? 34 : 22, 'F')
    doc.setFillColor(49, 91, 232)
    doc.circle(13, firstPage ? 15 : 11, 5.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(firstPage ? 16 : 11)
    doc.text('SPCR', 22, firstPage ? 12 : 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('Système de Pilotage et de Gestion du Coût de Revient', 22, firstPage ? 17 : 14)
    if (firstPage) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('DOCUMENT DE RÉFÉRENCE', pageWidth - 17, 12, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.text('Version du 22 juin 2026', pageWidth - 17, 17, { align: 'right' })
    }
    y = firstPage ? 43 : 30
  }

  const addPage = () => {
    doc.addPage()
    drawPageHeader(false)
  }

  const ensureSpace = (height) => {
    if (y + height > bottom) addPage()
  }

  const writeLines = (lines, options = {}) => {
    const lineHeight = options.lineHeight || 4.7
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal')
    doc.setFontSize(options.fontSize || 9.2)
    doc.setTextColor(...(options.color || [51, 65, 85]))
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, left + (options.indent || 0), y)
      y += lineHeight
    }
  }

  drawPageHeader(true)
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  const titleLines = doc.splitTextToSize(definition.title, textWidth)
  writeLines(titleLines, { bold: true, fontSize: 17, lineHeight: 7, color: [15, 23, 42] })
  doc.setFont('helvetica', 'normal')
  const subtitleLines = doc.splitTextToSize(definition.subtitle, textWidth)
  writeLines(subtitleLines, { fontSize: 9, lineHeight: 4.5, color: [100, 116, 139] })
  y += 4

  for (const [heading, paragraphs] of definition.sections) {
    ensureSpace(15)
    doc.setFillColor(239, 246, 255)
    doc.roundedRect(left, y - 4.2, textWidth, 8, 1.2, 1.2, 'F')
    writeLines([heading], { bold: true, fontSize: 10.2, lineHeight: 7, color: [15, 44, 82], indent: 2 })
    y += 1.5

    for (const paragraph of paragraphs) {
      const lines = doc.splitTextToSize(paragraph, textWidth)
      writeLines(lines, { fontSize: 9.2, lineHeight: 4.7, color: [51, 65, 85] })
      y += 2.2
    }
    y += 1.2
  }

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(226, 232, 240)
    doc.line(left, pageHeight - 13, pageWidth - right, pageHeight - 13)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('SPCR · Document interne de référence · Vin Ushindi', left, pageHeight - 8)
    doc.text(`Page ${page} / ${totalPages}`, pageWidth - right, pageHeight - 8, { align: 'right' })
  }

  doc.setProperties({
    title: definition.title,
    subject: definition.subtitle,
    author: 'SPCR - Vin Ushindi',
    creator: 'SPCR',
  })

  fs.mkdirSync(outputDirectory, { recursive: true })
  const output = path.join(outputDirectory, definition.filename)
  fs.writeFileSync(output, Buffer.from(doc.output('arraybuffer')))
  return { filename: definition.filename, pages: totalPages, bytes: fs.statSync(output).size }
}

for (const documentDefinition of documents) {
  const result = generatePdf(documentDefinition)
  process.stdout.write(`${result.filename}: ${result.pages} pages, ${result.bytes} octets\n`)
}
