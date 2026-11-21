import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';
import { Subject, Topic, Question } from '../api/_lib/models.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://jaishankarp089_db_user:ds2Y2EWn9wUnau2d@cluster0.hh5c4ci.mongodb.net/gpat_prep?retryWrites=true&w=majority';

export const GPAT_SUBJECTS = [
  {
    slug: 'pharmaceutics',
    name: 'Pharmaceutics',
    order: 1,
    color: '#1e4d3b',
    description: 'Physical pharmacy, dosage forms, biopharmaceutics, kinetics, and novel drug delivery.'
  },
  {
    slug: 'pharmacology',
    name: 'Pharmacology',
    order: 2,
    color: '#1e3a5f',
    description: 'Mechanisms of action, pharmacodynamics, pharmacokinetics, and chemotherapy.'
  },
  {
    slug: 'chemistry',
    name: 'Pharmaceutical Chemistry',
    order: 3,
    color: '#3b3054',
    description: 'Organic chemistry, medicinal chemistry, spectroscopy, and analytical methods.'
  },
  {
    slug: 'pharmacognosy',
    name: 'Pharmacognosy',
    order: 4,
    color: '#4a3b2c',
    description: 'Crude drugs, secondary metabolites, plant chemistry, and herbal formulations.'
  },
  {
    slug: 'other',
    name: 'Jurisprudence & Other Subjects',
    order: 5,
    color: '#475569',
    description: 'Pharmacy law, ethics, drug regulatory affairs, hospital & clinical pharmacy.'
  }
];

export const GPAT_TOPICS = [
  // 1. Pharmaceutics
  { subjectSlug: 'pharmaceutics', chapter: 'Physical Pharmacy', title: 'Micromeritics and Powder Rheology', importance: 'high', estimatedHours: 3, order: 1 },
  { subjectSlug: 'pharmaceutics', chapter: 'Physical Pharmacy', title: 'Interfacial Phenomena & Surface Tension', importance: 'medium', estimatedHours: 2, order: 2 },
  { subjectSlug: 'pharmaceutics', chapter: 'Physical Pharmacy', title: 'Colloids & Coarse Dispersions (Suspensions & Emulsions)', importance: 'high', estimatedHours: 3, order: 3 },
  { subjectSlug: 'pharmaceutics', chapter: 'Dosage Forms', title: 'Tablets: Formulation, Granulation & Defects', importance: 'high', estimatedHours: 4, order: 4 },
  { subjectSlug: 'pharmaceutics', chapter: 'Dosage Forms', title: 'Capsules: Hard & Soft Gelatin Manufacture', importance: 'medium', estimatedHours: 2, order: 5 },
  { subjectSlug: 'pharmaceutics', chapter: 'Dosage Forms', title: 'Parenterals & Sterilization Technology', importance: 'high', estimatedHours: 3, order: 6 },
  { subjectSlug: 'pharmaceutics', chapter: 'Biopharmaceutics', title: 'Absorption Mechanisms & BCS Classification', importance: 'high', estimatedHours: 3, order: 7 },
  { subjectSlug: 'pharmaceutics', chapter: 'Biopharmaceutics', title: 'Pharmacokinetic Models: One-Compartment Kinetics', importance: 'high', estimatedHours: 4, order: 8 },
  { subjectSlug: 'pharmaceutics', chapter: 'NDDS', title: 'Liposomes, Niosomes & Nanoparticles', importance: 'medium', estimatedHours: 2, order: 9 },

  // 2. Pharmacology
  { subjectSlug: 'pharmacology', chapter: 'General Pharmacology', title: 'Receptor Dynamics & Signal Transduction (GPCRs, Ion Channels)', importance: 'high', estimatedHours: 4, order: 1 },
  { subjectSlug: 'pharmacology', chapter: 'General Pharmacology', title: 'Drug Metabolism & Cytochrome P450 Enzymes', importance: 'high', estimatedHours: 3, order: 2 },
  { subjectSlug: 'pharmacology', chapter: 'Autonomic Nervous System', title: 'Cholinergic Agonists & Antagonists', importance: 'high', estimatedHours: 4, order: 3 },
  { subjectSlug: 'pharmacology', chapter: 'Autonomic Nervous System', title: 'Adrenergic Receptors & Sympathomimetics', importance: 'high', estimatedHours: 4, order: 4 },
  { subjectSlug: 'pharmacology', chapter: 'Cardiovascular System', title: 'Antihypertensives (RAAS Inhibitors, CCBs, Beta Blockers)', importance: 'high', estimatedHours: 4, order: 5 },
  { subjectSlug: 'pharmacology', chapter: 'Cardiovascular System', title: 'Antianginal & Antiarrhythmic Drugs', importance: 'high', estimatedHours: 3, order: 6 },
  { subjectSlug: 'pharmacology', chapter: 'Central Nervous System', title: 'Antidepressants & Antipsychotics', importance: 'medium', estimatedHours: 3, order: 7 },
  { subjectSlug: 'pharmacology', chapter: 'Chemotherapy', title: 'Beta-Lactam Antibiotics & Resistance Mechanisms', importance: 'high', estimatedHours: 4, order: 8 },
  { subjectSlug: 'pharmacology', chapter: 'Chemotherapy', title: 'Antitubercular & Antimalarial Regimens', importance: 'high', estimatedHours: 3, order: 9 },

  // 3. Pharmaceutical Chemistry
  { subjectSlug: 'chemistry', chapter: 'Organic & Medicinal', title: 'SAR of Beta-Lactam Antibiotics', importance: 'high', estimatedHours: 3, order: 1 },
  { subjectSlug: 'chemistry', chapter: 'Organic & Medicinal', title: 'SAR of Opioid Analgesics & Morphine Derivatives', importance: 'high', estimatedHours: 3, order: 2 },
  { subjectSlug: 'chemistry', chapter: 'Organic & Medicinal', title: 'Stereochemistry: Chirality, Enantiomers & Fischer Projections', importance: 'high', estimatedHours: 3, order: 3 },
  { subjectSlug: 'chemistry', chapter: 'Analytical Chemistry', title: 'UV-Visible Spectroscopy & Beer-Lambert Law', importance: 'high', estimatedHours: 3, order: 4 },
  { subjectSlug: 'chemistry', chapter: 'Analytical Chemistry', title: 'Infrared (IR) Spectroscopy: Characteristic Absorption Bands', importance: 'high', estimatedHours: 3, order: 5 },
  { subjectSlug: 'chemistry', chapter: 'Analytical Chemistry', title: 'Proton NMR: Chemical Shift, Spin-Spin Splitting', importance: 'high', estimatedHours: 4, order: 6 },
  { subjectSlug: 'chemistry', chapter: 'Analytical Chemistry', title: 'Chromatography: HPLC & Gas Chromatography Principles', importance: 'high', estimatedHours: 3, order: 7 },

  // 4. Pharmacognosy
  { subjectSlug: 'pharmacognosy', chapter: 'Alkaloids', title: 'Tropane Alkaloids: Belladonna, Datura & Hyoscyamus', importance: 'high', estimatedHours: 3, order: 1 },
  { subjectSlug: 'pharmacognosy', chapter: 'Alkaloids', title: 'Opium, Cinchona & Ergot Alkaloids', importance: 'high', estimatedHours: 4, order: 2 },
  { subjectSlug: 'pharmacognosy', chapter: 'Glycosides', title: 'Anthraquinone & Cardiac Glycosides (Digitalis, Senna)', importance: 'high', estimatedHours: 3, order: 3 },
  { subjectSlug: 'pharmacognosy', chapter: 'Secondary Metabolites', title: 'Volatile Oils & Terpenoids Extraction', importance: 'medium', estimatedHours: 2, order: 4 },
  { subjectSlug: 'pharmacognosy', chapter: 'Quality Control', title: 'Microscopy: Stomata Types & Quantitative Microscopy (Lyco Method)', importance: 'high', estimatedHours: 3, order: 5 },

  // 5. Jurisprudence & Other Subjects
  { subjectSlug: 'other', chapter: 'Pharmacy Jurisprudence', title: 'Drugs and Cosmetics Act 1940: Schedules M, C, H & X', importance: 'high', estimatedHours: 4, order: 1 },
  { subjectSlug: 'other', chapter: 'Pharmacy Jurisprudence', title: 'Pharmacy Act 1948 & PCI Regulations', importance: 'high', estimatedHours: 2, order: 2 },
  { subjectSlug: 'other', chapter: 'Pharmacy Jurisprudence', title: 'Narcotic Drugs and Psychotropic Substances (NDPS) Act 1985', importance: 'medium', estimatedHours: 2, order: 3 },
  { subjectSlug: 'other', chapter: 'Hospital Pharmacy', title: 'Hospital Formulary & Adverse Drug Reaction (ADR) Monitoring', importance: 'medium', estimatedHours: 2, order: 4 }
];

export const GPAT_QUESTIONS = [
  {
    subjectSlug: 'pharmaceutics',
    chapter: 'Physical Pharmacy',
    questionText: 'According to Stokes’ Law, which modification will effectively decrease the sedimentation velocity of a suspension?',
    options: [
      { key: 'A', text: 'Increasing particle diameter' },
      { key: 'B', text: 'Decreasing the viscosity of the dispersion medium' },
      { key: 'C', text: 'Increasing the viscosity of the dispersion medium' },
      { key: 'D', text: 'Increasing the density difference between disperse phase and medium' }
    ],
    correctOption: 'C',
    explanation: 'Stokes’ Law states v = [2 * r^2 * (rho_s - rho_o) * g] / (9 * eta). Because viscosity (eta) is in the denominator, increasing the viscosity decreases the sedimentation rate v.',
    difficulty: 'easy',
    year: 'GPAT 2021'
  },
  {
    subjectSlug: 'pharmaceutics',
    chapter: 'Dosage Forms',
    questionText: 'In tablet manufacturing, capping is primarily caused by which of the following?',
    options: [
      { key: 'A', text: 'Excess moisture in the granules' },
      { key: 'B', text: 'Air entrapment during rapid compression of granular mass' },
      { key: 'C', text: 'Excessive lubricant quantity' },
      { key: 'D', text: 'Low punch pressure' }
    ],
    correctOption: 'B',
    explanation: 'Capping is the partial or complete removal of top or bottom crown of a tablet from the main body, primarily caused by air entrapment in granules during compression.',
    difficulty: 'medium',
    year: 'GPAT 2022'
  },
  {
    subjectSlug: 'pharmaceutics',
    chapter: 'Biopharmaceutics',
    questionText: 'According to the Biopharmaceutics Classification System (BCS), Class II drugs exhibit:',
    options: [
      { key: 'A', text: 'High Solubility, High Permeability' },
      { key: 'B', text: 'Low Solubility, High Permeability' },
      { key: 'C', text: 'High Solubility, Low Permeability' },
      { key: 'D', text: 'Low Solubility, Low Permeability' }
    ],
    correctOption: 'B',
    explanation: 'Class I = High Sol / High Perm; Class II = Low Sol / High Perm; Class III = High Sol / Low Perm; Class IV = Low Sol / Low Perm.',
    difficulty: 'easy',
    year: 'GPAT 2023'
  },
  {
    subjectSlug: 'pharmacology',
    chapter: 'General Pharmacology',
    questionText: 'Which of the following is an irreversible inhibitor of Cytochrome P450 enzymes that acts as a suicide inhibitor?',
    options: [
      { key: 'A', text: 'Phenobarbital' },
      { key: 'B', text: 'Secobarbital' },
      { key: 'C', text: 'Rifampin' },
      { key: 'D', text: 'St. John’s Wort' }
    ],
    correctOption: 'B',
    explanation: 'Allyl-containing barbiturates like secobarbital undergo metabolic activation that binds covalently to the heme of CYP450, destroying the enzyme (suicide inhibition).',
    difficulty: 'hard',
    year: 'GPAT 2020'
  },
  {
    subjectSlug: 'pharmacology',
    chapter: 'Autonomic Nervous System',
    questionText: 'Pilocarpine reduces intraocular pressure in open-angle glaucoma primarily by:',
    options: [
      { key: 'A', text: 'Blocking carbonic anhydrase in ciliary body' },
      { key: 'B', text: 'Contracting ciliary muscle, pulling the scleral spur to open trabecular meshwork' },
      { key: 'C', text: 'Constricting retinal arterioles' },
      { key: 'D', text: 'Decreasing aqueous humor synthesis via beta-2 antagonism' }
    ],
    correctOption: 'B',
    explanation: 'Pilocarpine is a direct muscarinic agonist (M3). It contracts the ciliary muscle, tensioning the scleral spur and facilitating aqueous drainage through the trabecular meshwork.',
    difficulty: 'medium',
    year: 'GPAT 2023'
  },
  {
    subjectSlug: 'pharmacology',
    chapter: 'Cardiovascular System',
    questionText: 'Dry cough associated with ACE inhibitors like Enalapril is due to the accumulation of:',
    options: [
      { key: 'A', text: 'Angiotensin II' },
      { key: 'B', text: 'Renin' },
      { key: 'C', text: 'Bradykinin and Substance P' },
      { key: 'D', text: 'Aldosterone' }
    ],
    correctOption: 'C',
    explanation: 'ACE is also kininase II, responsible for breaking down bradykinin. Inhibition of ACE leads to elevated levels of bradykinin and substance P in bronchial mucosa, causing a persistent dry cough.',
    difficulty: 'easy',
    year: 'GPAT 2022'
  },
  {
    subjectSlug: 'pharmacology',
    chapter: 'Chemotherapy',
    questionText: 'The mechanism of action of Vancomycin involves:',
    options: [
      { key: 'A', text: 'Binding to 30S ribosomal subunit' },
      { key: 'B', text: 'Binding to D-Ala-D-Ala terminus of cell wall peptidoglycan precursor' },
      { key: 'C', text: 'Inhibiting bacterial DNA gyrase' },
      { key: 'D', text: 'Inhibiting dihydrofolate reductase' }
    ],
    correctOption: 'B',
    explanation: 'Vancomycin is a glycopeptide antibiotic that binds tightly to the D-Ala-D-Ala terminal sequence of NAM/NAG-pentapeptide, preventing both transglycosylation and transpeptidation.',
    difficulty: 'medium',
    year: 'GPAT 2024'
  },
  {
    subjectSlug: 'chemistry',
    chapter: 'Analytical Chemistry',
    questionText: 'In IR spectroscopy, the characteristic carbonyl (C=O) stretch of a saturated aliphatic ketone appears near:',
    options: [
      { key: 'A', text: '3300 cm^-1' },
      { key: 'B', text: '2200 cm^-1' },
      { key: 'C', text: '1715 cm^-1' },
      { key: 'D', text: '1600 cm^-1' }
    ],
    correctOption: 'C',
    explanation: 'Saturated aliphatic ketones show a very sharp and intense C=O absorption peak around 1715 cm^-1. Carboxylic acids absorb near 1710 cm^-1, esters near 1735 cm^-1, and amides near 1680 cm^-1.',
    difficulty: 'easy',
    year: 'GPAT 2021'
  },
  {
    subjectSlug: 'chemistry',
    chapter: 'Analytical Chemistry',
    questionText: 'In 1H-NMR spectroscopy, what is the multiplicity of the methylene (-CH2-) protons in ethyl bromide (CH3-CH2-Br)?',
    options: [
      { key: 'A', text: 'Singlet' },
      { key: 'B', text: 'Doublet' },
      { key: 'C', text: 'Triplet' },
      { key: 'D', text: 'Quartet' }
    ],
    correctOption: 'D',
    explanation: 'By the n+1 rule, the methylene group has 3 neighboring equivalent protons on the adjacent methyl group (-CH3). Therefore, multiplicity = 3 + 1 = 4 (Quartet).',
    difficulty: 'easy',
    year: 'GPAT 2023'
  },
  {
    subjectSlug: 'pharmacognosy',
    chapter: 'Alkaloids',
    questionText: 'Vitali-Morin reaction is a specific qualitative chemical identification test for which class of alkaloids?',
    options: [
      { key: 'A', text: 'Cinchona alkaloids' },
      { key: 'B', text: 'Tropane alkaloids' },
      { key: 'C', text: 'Opium alkaloids' },
      { key: 'D', text: 'Purine alkaloids' }
    ],
    correctOption: 'B',
    explanation: 'Vitali-Morin test produces a bright violet-purple coloration when tropane alkaloids (e.g. atropine, scopolamine) are evaporated with fuming nitric acid and treated with methanolic KOH.',
    difficulty: 'easy',
    year: 'GPAT 2022'
  },
  {
    subjectSlug: 'pharmacognosy',
    chapter: 'Glycosides',
    questionText: 'Keller-Kiliani test is specifically used for the detection of:',
    options: [
      { key: 'A', text: 'Deoxy sugar (Digitoxose) in cardiac glycosides' },
      { key: 'B', text: 'Anthraquinone glycosides' },
      { key: 'C', text: 'Flavonoid glycosides' },
      { key: 'D', text: 'Cyanogenetic glycosides' }
    ],
    correctOption: 'A',
    explanation: 'Keller-Kiliani test produces a reddish-brown ring at the interface with the upper acetic acid layer turning bluish-green, indicating 2-deoxysugars like digitoxose in Digitalis purpurea.',
    difficulty: 'medium',
    year: 'GPAT 2021'
  },
  {
    subjectSlug: 'other',
    chapter: 'Pharmacy Jurisprudence',
    questionText: 'In the Drugs and Cosmetics Act 1940, Schedule M specifically prescribes requirements for:',
    options: [
      { key: 'A', text: 'Good Laboratory Practices' },
      { key: 'B', text: 'Good Manufacturing Practices (GMP) and factory premises' },
      { key: 'C', text: 'List of poisonous substances under ayurvedic system' },
      { key: 'D', text: 'Standards for surgical dressings' }
    ],
    correctOption: 'B',
    explanation: 'Schedule M of the Drugs and Cosmetics Act deals with Good Manufacturing Practices (GMP) and requirements of premises, plant, and equipment for pharmaceutical products.',
    difficulty: 'easy',
    year: 'GPAT 2023'
  },
  {
    subjectSlug: 'other',
    chapter: 'Pharmacy Jurisprudence',
    questionText: 'Under the Pharmacy Act 1948, how many members are elected by the University Grants Commission to the Pharmacy Council of India (PCI)?',
    options: [
      { key: 'A', text: 'One member representing UGC' },
      { key: 'B', text: 'Six members from pharmacy colleges' },
      { key: 'C', text: 'Three members representing AICTE' },
      { key: 'D', text: 'Two members representing state councils' }
    ],
    correctOption: 'A',
    explanation: 'Under Section 3(c) of the Pharmacy Act, one member is elected by the University Grants Commission from among the representatives of universities.',
    difficulty: 'medium',
    year: 'GPAT 2024'
  },
  {
    subjectSlug: 'pharmaceutics',
    chapter: 'Physical Pharmacy',
    questionText: 'The HLB value range recommended for water-in-oil (W/O) emulsifying agents is:',
    options: [
      { key: 'A', text: '1 to 3' },
      { key: 'B', text: '3 to 6' },
      { key: 'C', text: '8 to 16' },
      { key: 'D', text: '15 to 18' }
    ],
    correctOption: 'B',
    explanation: 'According to Griffin’s scale: W/O emulsifiers have HLB 3-6 (lipophilic), whereas O/W emulsifiers have HLB 8-16 (hydrophilic).',
    difficulty: 'easy',
    year: 'GPAT 2022'
  },
  {
    subjectSlug: 'pharmacology',
    chapter: 'Cardiovascular System',
    questionText: 'Which diuretic is considered the drug of choice in heart failure patients with symptomatic hyperaldosteronism?',
    options: [
      { key: 'A', text: 'Furosemide' },
      { key: 'B', text: 'Hydrochlorothiazide' },
      { key: 'C', text: 'Spironolactone' },
      { key: 'D', text: 'Acetazolamide' }
    ],
    correctOption: 'C',
    explanation: 'Spironolactone and eplerenone are competitive mineralocorticoid (aldosterone) receptor antagonists in the collecting tubule that reduce cardiac remodeling and mortality in heart failure.',
    difficulty: 'easy',
    year: 'GPAT 2023'
  }
];

export async function runSeed() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas.');

  // 1. Seed Subjects
  console.log('Seeding GPAT Subjects...');
  const subjectDocMap = {};
  for (const s of GPAT_SUBJECTS) {
    const doc = await Subject.findOneAndUpdate(
      { slug: s.slug },
      { $set: s },
      { upsert: true, new: true }
    );
    subjectDocMap[s.slug] = doc._id;
  }
  console.log(`Upserted ${GPAT_SUBJECTS.length} subjects.`);

  // 2. Seed Topics
  console.log('Seeding GPAT Syllabus Topics...');
  const topicDocMap = {};
  for (const t of GPAT_TOPICS) {
    const subId = subjectDocMap[t.subjectSlug];
    if (!subId) continue;

    const doc = await Topic.findOneAndUpdate(
      { subjectId: subId, title: t.title },
      {
        $set: {
          subjectId: subId,
          chapter: t.chapter,
          title: t.title,
          importance: t.importance,
          estimatedHours: t.estimatedHours,
          order: t.order
        }
      },
      { upsert: true, new: true }
    );
    topicDocMap[t.title] = doc._id;
  }
  console.log(`Upserted ${GPAT_TOPICS.length} syllabus topics.`);

  // 3. Seed Questions
  console.log('Seeding High-Yield GPAT Questions...');
  let qCount = 0;
  for (const q of GPAT_QUESTIONS) {
    const subId = subjectDocMap[q.subjectSlug];
    const topId = topicDocMap[q.chapter] || null;

    await Question.findOneAndUpdate(
      { questionText: q.questionText },
      {
        $set: {
          subjectId: subId,
          topicId: topId,
          chapter: q.chapter,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty,
          year: q.year
        }
      },
      { upsert: true }
    );
    qCount++;
  }
  console.log(`Upserted ${qCount} GPAT questions.`);

  console.log('Database seeding complete! All models ready.');
  await mongoose.disconnect();
}

// If run directly
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
