import { authenticate } from './_lib/auth.js';
import { sendJson, sendError } from './_lib/utils.js';

export const REVISION_DATA = {
  drugClasses: [
    {
      category: 'Cardiovascular System',
      subCategory: 'Antihypertensives',
      classes: [
        { name: 'ACE Inhibitors', suffix: '-pril', examples: 'Captopril, Enalapril, Ramipril, Lisinopril', moa: 'Inhibits Angiotensin Converting Enzyme, reducing Angiotensin II' },
        { name: 'ARBs (AT1 Blockers)', suffix: '-sartan', examples: 'Losartan, Telmisartan, Valsartan', moa: 'Blocks AT1 receptors directly, avoids bradykinin cough' },
        { name: 'Beta Blockers', suffix: '-olol', examples: 'Propranolol, Atenolol, Metoprolol', moa: 'Blocks beta-1 and/or beta-2 adrenergic receptors' },
        { name: 'Calcium Channel Blockers', suffix: '-dipine / other', examples: 'Amlodipine, Nifedipine, Verapamil, Diltiazem', moa: 'Blocks L-type voltage-gated Ca2+ channels in vascular smooth muscle & heart' }
      ]
    },
    {
      category: 'Central Nervous System',
      subCategory: 'Sedatives & Antiepileptics',
      classes: [
        { name: 'Benzodiazepines', suffix: '-azepam / -azolam', examples: 'Diazepam, Lorazepam, Alprazolam', moa: 'Increases GABA-A channel opening frequency' },
        { name: 'Barbiturates', suffix: '-barbital', examples: 'Phenobarbital, Thiopental sodium', moa: 'Increases GABA-A channel opening duration' },
        { name: 'Hydantoins', suffix: '-toin', examples: 'Phenytoin', moa: 'Blocks voltage-gated Na+ channels in inactivated state, zero-order kinetics at therapeutic dose' }
      ]
    },
    {
      category: 'Antimicrobials',
      subCategory: 'Antibiotics',
      classes: [
        { name: 'Beta-Lactams', suffix: '-cillin / Cef-', examples: 'Penicillin G, Amoxicillin, Ceftriaxone', moa: 'Inhibits transpeptidation during bacterial cell wall synthesis' },
        { name: 'Aminoglycosides', suffix: '-mycin / -micin', examples: 'Gentamicin, Amikacin, Streptomycin', moa: 'Binds 30S ribosomal subunit, causes misreading of mRNA (Ototoxic & Nephrotoxic)' },
        { name: 'Macrolides', suffix: '-thromycin', examples: 'Azithromycin, Clarithromycin, Erythromycin', moa: 'Binds 50S ribosomal subunit, inhibits translocation' },
        { name: 'Fluoroquinolones', suffix: '-floxacin', examples: 'Ciprofloxacin, Levofloxacin', moa: 'Inhibits DNA Gyrase (Topoisomerase II) and Topoisomerase IV' }
      ]
    }
  ],
  formulas: [
    {
      name: "Stokes' Law (Sedimentation Velocity)",
      formula: "v = [ 2 * r^2 * (rho_s - rho_o) * g ] / (9 * eta)",
      parameters: "v = rate of settling, r = particle radius, rho_s & rho_o = densities of solid & liquid, eta = viscosity of medium, g = gravity",
      highYieldPoint: "Reducing particle radius (r) or increasing viscosity (eta) decreases sedimentation rate in pharmaceutical suspensions."
    },
    {
      name: "Noyes-Whitney Equation (Dissolution Rate)",
      formula: "dM/dt = [ D * A * (Cs - C) ] / h",
      parameters: "dM/dt = dissolution rate, D = diffusion coefficient, A = surface area, Cs = saturation solubility, C = drug concentration in bulk, h = boundary layer thickness",
      highYieldPoint: "Micronization increases effective surface area (A), accelerating dissolution of poorly soluble drugs (BCS Class II)."
    },
    {
      name: "Henderson-Hasselbalch Equation",
      formula: "pH = pKa + log([Ionized] / [Unionized]) (for weak acids)\npH = pKa + log([Unionized] / [Ionized]) (for weak bases)",
      parameters: "Relates pH of medium, pKa of electrolyte, and degree of ionization",
      highYieldPoint: "Unionized drug fraction is lipid-soluble and absorbs across biological membranes (pH-partition hypothesis)."
    },
    {
      name: "Young's Rule & Dilling's Rule (Pediatric Dosing)",
      formula: "Young's Rule (1-12 yrs): Child Dose = [ Age / (Age + 12) ] * Adult Dose\nDilling's Rule (4-20 yrs): Child Dose = [ Age / 20 ] * Adult Dose",
      parameters: "Age in years",
      highYieldPoint: "Frequently asked in GPAT dispensing pharmacy section."
    },
    {
      name: "Hydrophilic-Lipophilic Balance (Griffin's HLB Scale)",
      formula: "HLB Scale 0 - 20:\n- 1 to 3: Antifoaming agents\n- 3 to 6: W/O Emulsifiers\n- 7 to 9: Wetting & Spreading agents\n- 8 to 16: O/W Emulsifiers\n- 13 to 15: Detergents\n- 15 to 18: Solubilizing agents",
      parameters: "HLB determines the surfactant application",
      highYieldPoint: "O/W emulsions require high HLB (8-16), W/O emulsions require low HLB (3-6)."
    }
  ],
  actsAndSchedules: [
    {
      act: "Drugs and Cosmetics Act, 1940 & Rules, 1945",
      keySchedules: [
        { code: "Schedule M", description: "Good Manufacturing Practices (GMP) and factory premises requirements." },
        { code: "Schedule C & C1", description: "Biological and special products (sera, vaccines, antibiotics for parenteral use)." },
        { code: "Schedule G", description: "Drugs to be taken under medical supervision (e.g. Metformin, Carbutamide)." },
        { code: "Schedule H & H1", description: "Prescription drugs to be sold on prescription only. H1 requires 3-year record book (Cephalosporins, Quinolones)." },
        { code: "Schedule X", description: "Narcotic and Psychotropic drugs requiring triplicate prescriptions and 2-year record retention." },
        { code: "Schedule Y", description: "Requirements and guidelines for clinical trials and import/manufacture of new drugs." },
        { code: "Schedule P", description: "Life period and storage conditions of drugs." },
        { code: "Schedule V", description: "Standards for patent or proprietary medicines." }
      ]
    },
    {
      act: "Pharmacy Act, 1948",
      keySchedules: [
        { code: "Section 3", description: "Constitution and composition of Pharmacy Council of India (PCI)." },
        { code: "Education Regs", description: "Minimum standards of education required for qualification as a pharmacist." },
        { code: "Registers", description: "Preparation and maintenance of First Register and subsequent registers of pharmacists." }
      ]
    },
    {
      act: "Drugs and Magic Remedies (Objectionable Advertisements) Act, 1954",
      keySchedules: [
        { code: "Objective", description: "Prohibits misleading advertisements claiming cure for specific diseases in Schedule (e.g. cancer, diabetes, epilepsy)." }
      ]
    }
  ],
  resourceLinks: [
    { name: "National Board of Examination in Medical Sciences (GPAT Portal)", url: "https://natboard.edu.in", category: "Official" },
    { name: "Pharmacy Council of India (PCI)", url: "https://www.pci.nic.in", category: "Official" },
    { name: "Indian Pharmacopoeia Commission (IPC)", url: "https://ipc.gov.in", category: "Reference" },
    { name: "Standard Textbook: K.D. Tripathi Pharmacology (8th Edition)", url: "https://www.jaypeebrothers.com", category: "Book Reference" },
    { name: "Standard Textbook: Lachman & Lieberman Industrial Pharmacy", url: "https://www.cbsd.com", category: "Book Reference" }
  ]
};

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to view revision sheets');
    }

    return sendJson(res, 200, {
      success: true,
      resources: REVISION_DATA
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Error loading resources');
  }
}

