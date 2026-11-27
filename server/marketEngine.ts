import type {
  GroundingSource,
  LiveExitSignal,
  LiveRecheckUpdate,
  ParameterCheck,
  ParameterStatus,
  ResearchLanguage,
  StockDeepReport,
  StockNewsItem,
  SwingMarket,
  TradeSetup,
  TradingSection,
  UniverseMode,
} from '../src/types.ts';

export interface UniverseStock {
  symbol: string;
  name: string;
  sector: string;
  mtf: boolean;
  roeHint: string;
  growthHint: string;
}

// High-liquidity official NIFTY 500 constituents across all major sectors (64 stocks)
export const NIFTY_500_UNIVERSE: UniverseStock[] = [
  { symbol: 'TRENT', name: 'Trent Ltd', sector: 'Retail & Consumer', mtf: true, roeHint: 'ROE ~28%, Low Debt', growthHint: 'Strong YoY retail expansion' },
  { symbol: 'BEL', name: 'Bharat Electronics Ltd', sector: 'Defence & Aerospace', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'Strong defence order book' },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd', sector: 'Defence & Aerospace', mtf: true, roeHint: 'ROE ~26%, Zero Debt', growthHint: 'Consistent revenue & PAT growth' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', mtf: true, roeHint: 'ROE ~16%, Strong CASA', growthHint: 'Steady credit & deposit growth' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', mtf: true, roeHint: 'ROE ~18%, Clean Asset Quality', growthHint: 'Consistent YoY NII & PAT growth' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'PSU Banking', mtf: true, roeHint: 'ROE ~17%, Improving NPA', growthHint: 'Healthy credit & profit momentum' },
  { symbol: 'AXISBANK', name: 'Axis Bank Ltd', sector: 'Banking', mtf: true, roeHint: 'ROE ~17%, Improving NIM', growthHint: 'Steady retail & corporate loan book' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', sector: 'Banking', mtf: true, roeHint: 'ROE ~15%, Strong Capital', growthHint: 'High CASA & prudent underwriting' },
  { symbol: 'PNB', name: 'Punjab National Bank', sector: 'PSU Banking', mtf: true, roeHint: 'ROE ~14%, Improving NPA', growthHint: 'Healthy PSU credit & recovery growth' },
  { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd', sector: 'Banking', mtf: true, roeHint: 'ROE ~14%, Clean Book', growthHint: 'Steady mid-sized bank growth' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', sector: 'NBFC / Financials', mtf: true, roeHint: 'ROE ~21%, Strong AUM', growthHint: '25%+ YoY AUM growth track' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Ltd', sector: 'NBFC / Insurance', mtf: true, roeHint: 'Strong Lending & Insurance', growthHint: 'Diversified financial services growth' },
  { symbol: 'CHOLAFIN', name: 'Cholamandalam Inv. & Fin.', sector: 'NBFC / Financials', mtf: true, roeHint: 'ROE ~20%, Diversified Book', growthHint: 'Strong vehicle & LAP disbursements' },
  { symbol: 'SHRIRAMFIN', name: 'Shriram Finance Ltd', sector: 'NBFC / Financials', mtf: true, roeHint: 'ROE ~16%, CV Leader', growthHint: 'Strong rural & MSME AUM growth' },
  { symbol: 'MUTHOOTFIN', name: 'Muthoot Finance Ltd', sector: 'NBFC / Gold Finance', mtf: true, roeHint: 'ROE ~19%, High Yield', growthHint: 'Strong gold loan AUM expansion' },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Co.', sector: 'Insurance', mtf: true, roeHint: 'Consistent VNB Margins', growthHint: 'Strong bancassurance APE growth' },
  { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co.', sector: 'Insurance', mtf: true, roeHint: 'Healthy Solvency & VNB', growthHint: 'Balanced protection & savings growth' },
  { symbol: 'BSE', name: 'BSE Ltd', sector: 'Capital Markets', mtf: true, roeHint: 'ROE ~25%, Zero Debt', growthHint: 'Strong derivatives & listing revenue' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', mtf: true, roeHint: 'Improving ROCE & ARPU', growthHint: 'Strong FCF & tariff tailwind' },
  { symbol: 'M&M', name: 'Mahindra & Mahindra Ltd', sector: 'Automobile', mtf: true, roeHint: 'ROE ~20%, Low Auto Debt', growthHint: 'Strong SUV & tractor demand' },
  { symbol: 'TVSMOTOR', name: 'TVS Motor Company Ltd', sector: 'Automobile', mtf: true, roeHint: 'ROE ~26%, Strong EV Share', growthHint: 'Outperforming 2W volume growth' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', mtf: true, roeHint: 'ROE ~16%, Net Cash', growthHint: 'SUV & CNG mix margin expansion' },
  { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd', sector: 'Automobile', mtf: true, roeHint: 'ROE ~28%, Zero Debt', growthHint: 'Premium 2W, EV & export growth' },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Ltd', sector: 'Automobile', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'Royal Enfield & VECV volume growth' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Ind.', sector: 'Pharma', mtf: true, roeHint: 'ROE ~16%, Net Cash', growthHint: 'Specialty pharma revenue growth' },
  { symbol: 'LUPIN', name: 'Lupin Ltd', sector: 'Pharma', mtf: true, roeHint: 'Improving ROE ~15%', growthHint: 'US respiratory & India growth' },
  { symbol: 'CIPLA', name: 'Cipla Ltd', sector: 'Pharma', mtf: true, roeHint: 'ROE ~16%, Net Cash', growthHint: 'Strong India & US generics' },
  { symbol: 'DRREDDY', name: 'Dr. Reddys Laboratories', sector: 'Pharma', mtf: true, roeHint: 'ROE ~18%, Net Cash', growthHint: 'US generics & biosimilars scale' },
  { symbol: 'DIVISLAB', name: 'Divis Laboratories Ltd', sector: 'Pharma / CRAMS', mtf: true, roeHint: 'ROE ~15%, Zero Debt', growthHint: 'Custom synthesis & API growth' },
  { symbol: 'TORNTPHARM', name: 'Torrent Pharmaceuticals', sector: 'Pharma', mtf: true, roeHint: 'ROE ~24%, High EBITDA', growthHint: 'Strong chronic India & Brazil mix' },
  { symbol: 'MAXHEALTH', name: 'Max Healthcare Inst. Ltd', sector: 'Healthcare', mtf: true, roeHint: 'ROE ~15%, High ARPOB', growthHint: 'Hospital bed expansion growth' },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Ent.', sector: 'Healthcare', mtf: true, roeHint: 'ROE ~16%, Strong Brand', growthHint: 'Hospital occupancy & 24/7 digital' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure & EPC', mtf: true, roeHint: 'ROE ~15%, Strong Order Book', growthHint: 'Infra & hydrocarbon execution' },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Retail', mtf: true, roeHint: 'Strong Cash Flows', growthHint: 'Jio, Retail & O2C scale' },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', sector: 'Oil & Gas', mtf: true, roeHint: 'ROE ~15%, High Dividend', growthHint: 'Upstream output & KG-basin ramp' },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corp', sector: 'Oil & Gas', mtf: true, roeHint: 'Strong Refining Margins', growthHint: 'Marketing & refining cashflows' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining & Energy', mtf: true, roeHint: 'ROE ~40%, High Dividend', growthHint: 'Steady dispatch & e-auction cash' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', sector: 'IT Services', mtf: true, roeHint: 'ROE ~50%, Zero Debt', growthHint: 'Stable margins & deal pipeline' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'IT Services', mtf: true, roeHint: 'ROE ~31%, Zero Debt', growthHint: 'Large deal TCV & cash generation' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd', sector: 'IT Services', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'ER&D & software services resilience' },
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd', sector: 'IT Services', mtf: true, roeHint: 'Margin Turnaround', growthHint: 'BFSI & telecom deal recovery' },
  { symbol: 'MPHASIS', name: 'Mphasis Ltd', sector: 'IT Services', mtf: true, roeHint: 'ROE ~19%, Zero Debt', growthHint: 'BFSI & AI-led cloud modernization deals' },
  { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd', sector: 'Midcap IT', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'Consistent QoQ IT growth' },
  { symbol: 'COFORGE', name: 'Coforge Ltd', sector: 'Midcap IT', mtf: true, roeHint: 'ROE ~22%, Healthy Orderbook', growthHint: 'Strong executable deal pipeline' },
  { symbol: 'DIXON', name: 'Dixon Technologies Ltd', sector: 'EMS / Electronics', mtf: true, roeHint: 'ROE ~24%, High Asset Turn', growthHint: 'PLI & mobile manufacturing surge' },
  { symbol: 'TITAN', name: 'Titan Company Ltd', sector: 'Consumer Discretionary', mtf: true, roeHint: 'ROE ~32%, Strong Moat', growthHint: 'Jewellery & retail compounding' },
  { symbol: 'PIDILITIND', name: 'Pidilite Industries Ltd', sector: 'Specialty Chemicals', mtf: true, roeHint: 'ROE ~23%, Zero Debt', growthHint: 'Market-leader adhesive moat' },
  { symbol: 'SRF', name: 'SRF Ltd', sector: 'Specialty Chemicals', mtf: true, roeHint: 'ROE ~15%, Fluorochem Leader', growthHint: 'Specialty chemicals & ref-gas growth' },
  { symbol: 'COROMANDEL', name: 'Coromandel International', sector: 'Agri & Fertilizers', mtf: true, roeHint: 'ROE ~18%, Zero Debt', growthHint: 'Crop protection & nutrients' },
  { symbol: 'CUMMINSIND', name: 'Cummins India Ltd', sector: 'Capital Goods', mtf: true, roeHint: 'ROE ~26%, Zero Debt', growthHint: 'Powergen & data-center demand' },
  { symbol: 'SIEMENS', name: 'Siemens Ltd', sector: 'Capital Goods', mtf: true, roeHint: 'ROE ~17%, Zero Debt', growthHint: 'Grid, mobility & automation orders' },
  { symbol: 'ABB', name: 'ABB India Ltd', sector: 'Capital Goods', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'Electrification & robotics growth' },
  { symbol: 'CGPOWER', name: 'CG Power & Industrial Sol.', sector: 'Capital Goods', mtf: true, roeHint: 'ROE ~30%, Zero Debt', growthHint: 'Power transformers & OSAT growth' },
  { symbol: 'SOLARINDS', name: 'Solar Industries India', sector: 'Defence & Explosives', mtf: true, roeHint: 'ROE ~28%, Low Debt', growthHint: 'Defence ammunition & export boom' },
  { symbol: 'POLYCAB', name: 'Polycab India Ltd', sector: 'Cables & Wires', mtf: true, roeHint: 'ROE ~22%, Net Cash', growthHint: 'Strong cables & FMEG demand' },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd', sector: 'Ports & Logistics', mtf: true, roeHint: 'ROE ~17%, Strong EBITDA', growthHint: 'Steady cargo volume expansion' },
  { symbol: 'GPPL', name: 'Gujarat Pipavav Port Ltd', sector: 'Ports & Logistics', mtf: false, roeHint: 'ROE ~16%, Zero Debt', growthHint: 'Healthy container & RoRo margins' },
  { symbol: 'POWERGRID', name: 'Power Grid Corp of India', sector: 'Power & Utilities', mtf: true, roeHint: 'ROE ~18%, Regulated Cash', growthHint: 'Steady transmission capex' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Power & Utilities', mtf: true, roeHint: 'Stable Regulated ROE', growthHint: 'Thermal + renewable capacity' },
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd', sector: 'Metals & Steel', mtf: true, roeHint: 'Cyclical Recovery', growthHint: 'India capacity expansion' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd', sector: 'Metals & Steel', mtf: true, roeHint: 'Leading Steel Capacity', growthHint: 'Domestic steel volume ramp' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd', sector: 'Metals & Aluminium', mtf: true, roeHint: 'Strong Novelis & India Ops', growthHint: 'Downstream aluminium & copper growth' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd', sector: 'Cement & Building', mtf: true, roeHint: 'ROE ~14%, Market Leader', growthHint: 'Pan-India capacity & infra demand' },
  { symbol: 'INDHOTEL', name: 'Indian Hotels Company Ltd', sector: 'Hospitality', mtf: true, roeHint: 'ROE ~16%, Net Cash', growthHint: 'High occupancy & RevPAR growth' },
];

// High-beta / High-momentum NSE NIFTY 1000 (Smallcap & Emerging Midcap) universe for High-Risk mode (48 stocks)
export const NIFTY_1000_HIGH_BETA_UNIVERSE: UniverseStock[] = [
  { symbol: 'KPITTECH', name: 'KPIT Technologies Ltd', sector: 'Auto ER&D / Tech', mtf: true, roeHint: 'ROE ~28%, Zero Debt', growthHint: 'High-growth EV & SDV software demand' },
  { symbol: 'MAZDOCK', name: 'Mazagon Dock Shipbuilders', sector: 'Defence & Shipbuilding', mtf: true, roeHint: 'ROE ~32%, Zero Debt', growthHint: 'Massive submarine & warship orderbook' },
  { symbol: 'COCHINSHIP', name: 'Cochin Shipyard Ltd', sector: 'Defence & Shipbuilding', mtf: true, roeHint: 'ROE ~16%, Net Cash', growthHint: 'Strong ship repair & defence pipeline' },
  { symbol: 'GRSE', name: 'Garden Reach Shipbuilders', sector: 'Defence & Shipbuilding', mtf: true, roeHint: 'ROE ~22%, Zero Debt', growthHint: 'Naval frigate & patrol vessel orders' },
  { symbol: 'BDL', name: 'Bharat Dynamics Ltd', sector: 'Defence & Missiles', mtf: true, roeHint: 'ROE ~18%, Zero Debt', growthHint: 'Missile systems & defence exports' },
  { symbol: 'BEML', name: 'BEML Ltd', sector: 'Defence & Rail Rolling', mtf: true, roeHint: 'Improving ROCE', growthHint: 'Metro coaches, Vande Bharat & defence' },
  { symbol: 'DATAPATTNS', name: 'Data Patterns (India) Ltd', sector: 'Defence Electronics', mtf: true, roeHint: 'ROE ~15%, Zero Debt', growthHint: 'High-margin radar & avionics systems' },
  { symbol: 'ZENTEC', name: 'Zen Technologies Ltd', sector: 'Defence Drones & Sim.', mtf: false, roeHint: 'ROE ~28%, Net Cash', growthHint: 'Anti-drone & defence simulator surge' },
  { symbol: 'TITAGARH', name: 'Titagarh Rail Systems Ltd', sector: 'Railways & Wagons', mtf: true, roeHint: 'ROE ~18%, Low Debt', growthHint: 'Freight wagon & metro coach growth' },
  { symbol: 'JWL', name: 'Jupiter Wagons Ltd', sector: 'Railways & Wagons', mtf: true, roeHint: 'ROE ~20%, Low Debt', growthHint: 'Wagons, wheelsets & EV commercial' },
  { symbol: 'IRFC', name: 'Indian Railway Finance Corp', sector: 'Railways NBFC', mtf: true, roeHint: 'Zero NPA Sovereign Book', growthHint: 'Steady railway capex financing scale' },
  { symbol: 'RVNL', name: 'Rail Vikas Nigam Ltd', sector: 'Railways & Infra', mtf: true, roeHint: 'ROE ~18%, Order Visibility', growthHint: 'Metro, rail & export EPC execution' },
  { symbol: 'RAILTEL', name: 'RailTel Corp of India', sector: 'Rail Telecom & IT', mtf: true, roeHint: 'ROE ~16%, Zero Debt', growthHint: 'Kavach, telecom & data center orders' },
  { symbol: 'IRCTC', name: 'IRCTC Ltd', sector: 'Rail Ticketing & Tourism', mtf: true, roeHint: 'ROE ~36%, Zero Debt', growthHint: 'Monopoly rail ticketing & Rail Neer' },
  { symbol: 'CDSL', name: 'Central Depository Services', sector: 'Capital Markets', mtf: true, roeHint: 'ROE ~30%, Zero Debt', growthHint: 'Demat & retail equity participation boom' },
  { symbol: 'MCX', name: 'Multi Commodity Exchange', sector: 'Capital Markets', mtf: true, roeHint: 'ROE ~22%, Zero Debt', growthHint: 'Strong commodity options volume surge' },
  { symbol: 'ANGELONE', name: 'Angel One Ltd', sector: 'Broking & Wealth', mtf: true, roeHint: 'ROE ~32%, High Margin', growthHint: 'Fast client & order volume scaling' },
  { symbol: 'CAMS', name: 'Computer Age Mgmt Services', sector: 'Capital Markets', mtf: true, roeHint: 'ROE ~38%, Zero Debt', growthHint: 'Mutual fund RTA & AIF scale' },
  { symbol: 'KFINTECH', name: 'KFin Technologies Ltd', sector: 'Capital Markets', mtf: true, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'Issuer solutions & global fund admin' },
  { symbol: 'MOTILALOFS', name: 'Motilal Oswal Financial', sector: 'Broking & Wealth', mtf: true, roeHint: 'ROE ~25%, Strong AMC', growthHint: 'Wealth, broking & AMC compounding' },
  { symbol: 'NUVAMA', name: 'Nuvama Wealth Management', sector: 'Wealth Management', mtf: false, roeHint: 'ROE ~24%, Fast AUM', growthHint: 'UHNI & affluent wealth fee growth' },
  { symbol: 'KAYNES', name: 'Kaynes Technology India', sector: 'EMS / Semiconductors', mtf: true, roeHint: 'ROE ~16%, High Growth', growthHint: 'OSAT & high-margin EMS orderbook' },
  { symbol: 'AMBER', name: 'Amber Enterprises India', sector: 'EMS / Consumer Durables', mtf: true, roeHint: 'Scaling Electronics Mix', growthHint: 'RAC components, PCB & railway HVAC' },
  { symbol: 'SYRMA', name: 'Syrma SGS Technology Ltd', sector: 'EMS / Electronics', mtf: false, roeHint: 'Low Debt EMS Scale', growthHint: 'Auto, industrial & healthcare EMS' },
  { symbol: 'PGEL', name: 'PG Electroplast Ltd', sector: 'EMS / Consumer Durables', mtf: false, roeHint: 'ROE ~18%, Rapid Scale', growthHint: 'AC & washing machine ODM expansion' },
  { symbol: 'NETWEB', name: 'Netweb Technologies India', sector: 'AI Servers & HPC', mtf: false, roeHint: 'ROE ~24%, Zero Debt', growthHint: 'AI GPU supercomputing order momentum' },
  { symbol: 'TEJASNET', name: 'Tejas Networks Ltd', sector: 'Telecom Equipment', mtf: true, roeHint: 'Tata Group Backed', growthHint: 'BSNL 4G/5G & optical gear deployment' },
  { symbol: 'SUZLON', name: 'Suzlon Energy Ltd', sector: 'Renewable Wind Energy', mtf: true, roeHint: 'Turnaround Net Cash', growthHint: 'Record wind turbine orderbook growth' },
  { symbol: 'INOXWIND', name: 'Inox Wind Ltd', sector: 'Renewable Wind Energy', mtf: false, roeHint: 'Deleveraged Orderbook', growthHint: 'Multi-GW wind EPC & O&M ramp' },
  { symbol: 'IREDA', name: 'Indian Renewable Energy Dev', sector: 'Renewable NBFC', mtf: true, roeHint: 'PSU Green Finance', growthHint: 'Solar, wind & storage loan book boom' },
  { symbol: 'KPIGREEN', name: 'KPI Green Energy Ltd', sector: 'Solar & Hybrid Power', mtf: false, roeHint: 'ROE ~24%, High Growth', growthHint: 'Captive solar & IPP capacity surge' },
  { symbol: 'HUDCO', name: 'HUDCO Ltd', sector: 'Housing & Infra Finance', mtf: true, roeHint: 'ROE ~13%, PSU Backing', growthHint: 'Urban infra & housing loan growth' },
  { symbol: 'NBCC', name: 'NBCC (India) Ltd', sector: 'PSU Redevelopment EPC', mtf: true, roeHint: 'ROE ~20%, Zero Debt', growthHint: 'Asset-light redevelopment orderbook' },
  { symbol: 'NCC', name: 'NCC Ltd', sector: 'Infrastructure & EPC', mtf: true, roeHint: 'ROE ~14%, Strong Orders', growthHint: 'Buildings, water & transmission EPC' },
  { symbol: 'ELECON', name: 'Elecon Engineering Co.', sector: 'Industrial Gears', mtf: false, roeHint: 'ROE ~22%, Net Cash', growthHint: 'High-margin industrial gear exports' },
  { symbol: 'TRITURBINE', name: 'Triveni Turbine Ltd', sector: 'Capital Goods / Turbines', mtf: true, roeHint: 'ROE ~30%, Zero Debt', growthHint: 'Industrial steam turbine export moat' },
  { symbol: 'KIRLOSBROS', name: 'Kirloskar Brothers Ltd', sector: 'Capital Goods / Pumps', mtf: false, roeHint: 'ROE ~21%, Net Cash', growthHint: 'Industrial pumps, water & energy orders' },
  { symbol: 'ACE', name: 'Action Construction Equip.', sector: 'Construction Equipment', mtf: false, roeHint: 'ROE ~28%, Zero Debt', growthHint: 'Cranes & infra equipment boom' },
  { symbol: 'APARINDS', name: 'Apar Industries Ltd', sector: 'Power Conductors & Cables', mtf: true, roeHint: 'ROE ~24%, Strong Exports', growthHint: 'Renewable grid & transformer demand' },
  { symbol: 'KEI', name: 'KEI Industries Ltd', sector: 'Cables & Wires', mtf: true, roeHint: 'ROE ~19%, Low Debt', growthHint: 'Strong EHV cable & retail wire growth' },
  { symbol: 'TARIL', name: 'Transformers & Rectifiers', sector: 'Power Transformers', mtf: false, roeHint: 'High Margin Ramp', growthHint: 'Grid & HV transformer capex wave' },
  { symbol: 'SCHNEIDER', name: 'Schneider Electric Infra', sector: 'Grid & Power Automation', mtf: false, roeHint: 'High ROCE MNC', growthHint: 'Data center & smart grid switchgear' },
  { symbol: 'ANANTRAJ', name: 'Anant Raj Ltd', sector: 'Data Centers & Realty', mtf: false, roeHint: 'Improving ROCE', growthHint: 'Data center & NCR residential ramp-up' },
  { symbol: 'HBLENGINE', name: 'HBL Engineering Ltd', sector: 'Rail Kavach & Batteries', mtf: false, roeHint: 'ROE ~23%, Low Debt', growthHint: 'Railway Kavach safety & niche power' },
  { symbol: 'OLECTRA', name: 'Olectra Greentech Ltd', sector: 'EV Buses & Mobility', mtf: true, roeHint: 'EV Bus Orderbook', growthHint: 'State transport e-bus deliveries' },
  { symbol: 'NEULANDLAB', name: 'Neuland Laboratories Ltd', sector: 'Pharma CDMO', mtf: false, roeHint: 'ROE ~22%, Low Debt', growthHint: 'High-margin CMS & peptide molecules' },
  { symbol: 'LAURUSLABS', name: 'Laurus Labs Ltd', sector: 'Pharma / CDMO', mtf: true, roeHint: 'CDMO Capex Ramp', growthHint: 'Synthesis & biologics recovery' },
  { symbol: 'DOMS', name: 'DOMS Industries Ltd', sector: 'Consumer Stationery', mtf: false, roeHint: 'ROE ~22%, Zero Debt', growthHint: 'Brand expansion & capacity ramp' },
];

export const US_LIQUID_UNIVERSE: UniverseStock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors', mtf: true, roeHint: 'ROE > 80%, Net Cash', growthHint: 'AI data-center revenue surge' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Software & Cloud', mtf: true, roeHint: 'ROE ~35%, AAA Balance Sheet', growthHint: 'Azure & Copilot growth' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Consumer Tech', mtf: true, roeHint: 'High FCF & Services Margin', growthHint: 'Ecosystem & services compounding' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Cloud & E-Commerce', mtf: true, roeHint: 'Expanding Operating Margins', growthHint: 'AWS & ads profit growth' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Digital Ads & AI', mtf: true, roeHint: 'ROE ~32%, Net Cash', growthHint: 'Strong ad monetization & AI' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Search & Cloud', mtf: true, roeHint: 'ROE ~30%, Net Cash', growthHint: 'Search + Cloud margin growth' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors', mtf: true, roeHint: 'High FCF Margin', growthHint: 'Custom AI ASICs & VMware' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare / Pharma', mtf: true, roeHint: 'Strong Innovation Moat', growthHint: 'GLP-1 & oncology growth' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking', mtf: true, roeHint: 'ROTCE ~20%, Fortress Balance', growthHint: 'Leading US bank profitability' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'Retail', mtf: true, roeHint: 'ROE ~30%, 90%+ Renewal', growthHint: 'Consistent membership compounding' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Media & Streaming', mtf: true, roeHint: 'Expanding Operating Margin', growthHint: 'Ad tier & subscriber growth' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', mtf: true, roeHint: 'Low Debt, Strong Cash', growthHint: 'Data-center CPU & GPU share' },
];

export interface ChartMetrics {
  symbol: string;
  yahooSymbol: string;
  companyName: string;
  exchange: string;
  currency: '₹' | '$';
  currentPrice: number;
  prevClose: number;
  dayChangePct: number;
  asOfDate: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  ema20: number;
  ema50: number;
  ema200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  atr14: number;
  atrPct: number; // Daily ATR as % of LTP
  avgWeeklyMovePct: number; // Avg rolling 5-day absolute % move over last 60 trading days
  latestVolume: number;
  avgVolume20: number;
  volumeRatio: number;
  avgTurnoverCr: number; // Approx daily turnover in Crores (INR) or $M (US)
  low10: number;
  high20: number;
  low20: number;
  low50: number;
  high60: number;
  low60: number;
  high120: number;
  low120: number;
  pivotLows: number[]; // Real fractal swing lows below price (closest first)
  pivotHighs: number[]; // Real fractal swing highs above price (closest first)
  ret1W: number;
  ret1M: number;
  ret3M: number;
  ret1Y: number;
  chartUrl: string;
}

export interface LiveFundamentals {
  roePct: number | null;
  revenueGrowthPct: number | null;
  earningsGrowthPct: number | null;
  debtToEquityRatio: number | null; // e.g. 0.25 means 0.25x
  profitMarginPct: number | null;
  trailingPe: number | null;
  forwardPe: number | null;
  trailingEps: number | null;
  forwardEps: number | null;
  priceToBook: number | null;
  bookValue: number | null;
  marketCapCr: number | null; // INR Crores for NSE, USD Millions for US
  dividendYieldPct: number | null;
  beta: number | null;
  targetMeanPrice: number | null;
  analystCount: number | null;
}

interface YahooCrumbSession {
  cookie: string;
  crumb: string;
  fetchedAt: number;
}

let cachedYahooSession: YahooCrumbSession | null = null;
let yahooSessionPromise: Promise<YahooCrumbSession | null> | null = null;
const fundamentalsCache = new Map<string, { data: LiveFundamentals | null; ts: number }>();

async function getYahooCrumbSession(forceRefresh = false): Promise<YahooCrumbSession | null> {
  const now = Date.now();
  if (!forceRefresh && cachedYahooSession && now - cachedYahooSession.fetchedAt < 15 * 60 * 1000) {
    return cachedYahooSession;
  }
  if (!forceRefresh && yahooSessionPromise) {
    return yahooSessionPromise;
  }

  yahooSessionPromise = (async () => {
    try {
      const initRes = await fetch('https://fc.yahoo.com', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HDDeepResearch/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      const setCookie = initRes.headers.get('set-cookie') || '';
      const cookiePair = setCookie.split(';')[0]?.trim() || '';
      if (!cookiePair) return null;

      const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HDDeepResearch/1.0)',
          Cookie: cookiePair,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!crumbRes.ok) return null;
      const crumb = (await crumbRes.text()).trim();
      if (!crumb || crumb.includes('<')) return null;

      cachedYahooSession = { cookie: cookiePair, crumb, fetchedAt: Date.now() };
      return cachedYahooSession;
    } catch {
      return null;
    } finally {
      yahooSessionPromise = null;
    }
  })();

  return yahooSessionPromise;
}

export async function fetchLiveFundamentals(
  rawSymbol: string,
  market: SwingMarket
): Promise<LiveFundamentals | null> {
  const cleanSym = rawSymbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
  if (!cleanSym || cleanSym.startsWith('^')) return null;
  const yahooSymbol = market === 'NSE' ? `${cleanSym}.NS` : cleanSym;

  const cached = fundamentalsCache.get(yahooSymbol);
  if (cached && Date.now() - cached.ts < 30 * 60 * 1000) {
    return cached.data;
  }

  const attemptFetch = async (forceRefresh: boolean): Promise<{ status: number; data: LiveFundamentals | null }> => {
    const session = await getYahooCrumbSession(forceRefresh);
    if (!session) return { status: 0, data: null };

    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      yahooSymbol
    )}?modules=financialData,defaultKeyStatistics,summaryDetail&crumb=${encodeURIComponent(session.crumb)}`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HDDeepResearch/1.0)',
          Cookie: session.cookie,
        },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return { status: res.status, data: null };

      const json = (await res.json()) as {
        quoteSummary?: {
          result?: Array<{
            financialData?: Record<string, { raw?: number }>;
            defaultKeyStatistics?: Record<string, { raw?: number }>;
            summaryDetail?: Record<string, { raw?: number }>;
          }>;
        };
      };
      const r = json.quoteSummary?.result?.[0];
      if (!r) return { status: 200, data: null };

      const fin = r.financialData || {};
      const stats = r.defaultKeyStatistics || {};
      const sum = r.summaryDetail || {};

      const num = (v?: { raw?: number }): number | null =>
        typeof v?.raw === 'number' && Number.isFinite(v.raw) ? v.raw : null;

      const roeRaw = num(fin.returnOnEquity);
      const revGRaw = num(fin.revenueGrowth);
      const earnGRaw = num(fin.earningsGrowth);
      const dteRaw = num(fin.debtToEquity);
      const pmRaw = num(fin.profitMargins);
      const mcapRaw = num(sum.marketCap);
      const divRaw = num(sum.dividendYield);

      const data: LiveFundamentals = {
        roePct: roeRaw !== null ? round2(roeRaw * 100) : null,
        revenueGrowthPct: revGRaw !== null ? round2(revGRaw * 100) : null,
        earningsGrowthPct: earnGRaw !== null ? round2(earnGRaw * 100) : null,
        debtToEquityRatio: dteRaw !== null ? round2(dteRaw / 100) : null,
        profitMarginPct: pmRaw !== null ? round2(pmRaw * 100) : null,
        trailingPe: num(sum.trailingPE) !== null ? round2(num(sum.trailingPE) as number) : null,
        forwardPe: num(sum.forwardPE) !== null ? round2(num(sum.forwardPE) as number) : null,
        trailingEps: num(stats.trailingEps) !== null ? round2(num(stats.trailingEps) as number) : null,
        forwardEps: num(stats.forwardEps) !== null ? round2(num(stats.forwardEps) as number) : null,
        priceToBook: num(stats.priceToBook) !== null ? round2(num(stats.priceToBook) as number) : null,
        bookValue: num(stats.bookValue) !== null ? round2(num(stats.bookValue) as number) : null,
        marketCapCr:
          mcapRaw !== null
            ? market === 'NSE'
              ? round2(mcapRaw / 1e7)
              : round2(mcapRaw / 1e6)
            : null,
        dividendYieldPct: divRaw !== null ? round2(divRaw * 100) : null,
        beta: num(stats.beta) !== null ? round2(num(stats.beta) as number) : null,
        targetMeanPrice: num(fin.targetMeanPrice) !== null ? round2(num(fin.targetMeanPrice) as number) : null,
        analystCount: num(fin.numberOfAnalystOpinions),
      };
      return { status: 200, data };
    } catch {
      return { status: 0, data: null };
    }
  };

  let out = await attemptFetch(false);
  if (out.status === 401 || out.status === 403) {
    out = await attemptFetch(true);
  }
  fundamentalsCache.set(yahooSymbol, { data: out.data, ts: Date.now() });
  return out.data;
}

function isFinancialSector(sector: string): boolean {
  return /(bank|nbfc|financ|broking|insurance|lending|housing)/i.test(sector);
}

// Dynamic volatility + liquidity based MTF Leverage (no fixed "3x-4x" guesswork)
export function computeDynamicMtfLeverage(
  m: ChartMetrics,
  isCatalogMtf: boolean,
  f?: LiveFundamentals | null
): { label: string; leverageNum: number; eligible: boolean } {
  const minTurnover = m.currency === '₹' ? 25 : 50;
  const beta = f?.beta ?? 1.0;
  if (!isCatalogMtf || m.avgTurnoverCr < minTurnover || m.atrPct > 5.0) {
    return { label: 'Cash Only (High Vol / Low Liq)', leverageNum: 1, eligible: false };
  }
  if (m.atrPct <= 2.1 && m.avgTurnoverCr >= (m.currency === '₹' ? 80 : 150) && beta <= 1.25) {
    return { label: '4x MTF (Low Vol · ~25% Margin)', leverageNum: 4, eligible: true };
  }
  if (m.atrPct <= 3.2 && m.avgTurnoverCr >= (m.currency === '₹' ? 35 : 70)) {
    return { label: '3x MTF (Mod Vol · ~33% Margin)', leverageNum: 3, eligible: true };
  }
  return { label: '2x MTF (High Vol · ~50% Margin)', leverageNum: 2, eligible: true };
}

// Multi-Model Fundamental Fair Value (Analyst Consensus + Growth-Calibrated Earnings P/E)
function computeFundamentalFairValue(
  m: ChartMetrics,
  f: LiveFundamentals | null,
  sector: string
): { fairValue: number; upsidePct: number; basisLabel: string } {
  const isFin = isFinancialSector(sector);
  const analystFair =
    f && f.targetMeanPrice && f.targetMeanPrice > 0 && (f.analystCount ?? 0) >= 2
      ? f.targetMeanPrice
      : null;

  let earningsFair: number | null = null;
  if (f) {
    const eps = f.forwardEps && f.forwardEps > 0 ? f.forwardEps : f.trailingEps;
    if (eps && eps > 0) {
      const growth = Math.max(0, Math.min(35, f.earningsGrowthPct ?? f.revenueGrowthPct ?? 12));
      const roeBoost = f.roePct && f.roePct >= 20 ? 4 : f.roePct && f.roePct >= 14 ? 2 : 0;
      const fairPe = isFin
        ? Math.max(12, Math.min(24, 13 + growth * 0.35 + roeBoost * 0.5))
        : Math.max(15, Math.min(38, 16 + growth * 0.65 + roeBoost));
      earningsFair = round2(eps * fairPe);
    } else if (isFin && f.bookValue && f.bookValue > 0) {
      const fairPb = f.roePct && f.roePct >= 16 ? 2.6 : 1.8;
      earningsFair = round2(f.bookValue * fairPb);
    }
  }

  let fairValue: number;
  let basisLabel: string;

  if (analystFair && earningsFair) {
    // Anchor 65% to live institutional analyst consensus + 35% to earnings-calibrated fair value
    fairValue = round2(analystFair * 0.65 + earningsFair * 0.35);
    basisLabel = `Consensus (${f?.analystCount} analysts) + Earnings Model`;
  } else if (analystFair) {
    fairValue = round2(analystFair);
    basisLabel = `Analyst Consensus (${f?.analystCount} analysts)`;
  } else if (earningsFair) {
    fairValue = round2(earningsFair);
    basisLabel = `Forward EPS × Growth Fair P/E`;
  } else {
    // Only when exchange feed lacks earnings/analyst data completely
    fairValue = round2(Math.max(m.ema200 * 1.05, m.currentPrice));
    basisLabel = `200 EMA Technical Mean (No EPS feed)`;
  }

  const upsidePct = m.currentPrice > 0 ? round2(((fairValue - m.currentPrice) / m.currentPrice) * 100) : 0;
  return { fairValue, upsidePct, basisLabel };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function calcRsi14(closes: number[]): number {
  if (closes.length < 16) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= 14; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / 14;
  let avgLoss = losses / 14;
  for (let i = 15; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * 13 + g) / 14;
    avgLoss = (avgLoss * 13 + l) / 14;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return round2(100 - 100 / (1 + rs));
}

function calcAtr14(highs: number[], lows: number[], closes: number[]): number {
  const len = closes.length;
  if (len < 15) return closes[len - 1] * 0.025;
  let sum = 0;
  for (let i = len - 14; i < len; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    sum += tr;
  }
  return round2(sum / 14);
}

function pctReturn(closes: number[], lookback: number): number {
  const n = closes.length;
  if (n <= lookback || closes[n - 1 - lookback] <= 0) return 0;
  return round2(((closes[n - 1] - closes[n - 1 - lookback]) / closes[n - 1 - lookback]) * 100);
}

// Detect real fractal pivot swing lows & highs from actual daily OHLCV candles
function extractPivotLevels(
  highs: number[],
  lows: number[],
  currentPrice: number
): { pivotLows: number[]; pivotHighs: number[] } {
  const n = lows.length;
  const rawLows: number[] = [];
  const rawHighs: number[] = [];
  const start = Math.max(2, n - 180);

  for (let i = start; i < n - 2; i++) {
    const l = lows[i];
    if (
      l < currentPrice * 0.992 &&
      l <= lows[i - 1] &&
      l <= lows[i - 2] &&
      l <= lows[i + 1] &&
      l <= lows[i + 2]
    ) {
      rawLows.push(round2(l));
    }
    const h = highs[i];
    if (
      h > currentPrice * 1.008 &&
      h >= highs[i - 1] &&
      h >= highs[i - 2] &&
      h >= highs[i + 1] &&
      h >= highs[i + 2]
    ) {
      rawHighs.push(round2(h));
    }
  }

  // Cluster very close levels (<1.2% apart) to keep clean structural zones
  const dedupe = (arr: number[], desc: boolean): number[] => {
    const sorted = [...arr].sort((a, b) => (desc ? b - a : a - b));
    const out: number[] = [];
    for (const v of sorted) {
      if (out.every((existing) => Math.abs(existing - v) / existing >= 0.012)) {
        out.push(v);
      }
    }
    return out;
  };

  return {
    pivotLows: dedupe(rawLows, true).slice(0, 8),
    pivotHighs: dedupe(rawHighs, false).slice(0, 8),
  };
}

// Measure stock's actual rolling 5-trading-day absolute movement speed over recent 60 sessions
function calcAvgWeeklyMovePct(closes: number[]): number {
  const n = closes.length;
  if (n < 12) return 3.0;
  const start = Math.max(5, n - 60);
  const moves: number[] = [];
  for (let i = start; i < n; i++) {
    const base = closes[i - 5];
    if (base > 0) {
      moves.push(Math.abs(((closes[i] - base) / base) * 100));
    }
  }
  if (moves.length === 0) return 3.0;
  return round2(moves.reduce((a, b) => a + b, 0) / moves.length);
}

const chartMetricsCache = new Map<string, { data: ChartMetrics | null; ts: number }>();

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runWorker = async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await worker(items[idx], idx);
    }
  };
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

export async function fetchChartMetrics(
  rawSymbol: string,
  market: SwingMarket,
  bypassCache = false
): Promise<ChartMetrics | null> {
  const cleanSym = rawSymbol.trim().toUpperCase().replace(/\.(NS|BO)$/i, '');
  const yahooSymbol =
    cleanSym.startsWith('^')
      ? cleanSym
      : market === 'NSE'
        ? `${cleanSym}.NS`
        : cleanSym;

  if (!bypassCache) {
    const cached = chartMetricsCache.get(yahooSymbol);
    if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
      return cached.data;
    }
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?range=1y&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HDDeepResearch/1.0)' },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            symbol?: string;
            shortName?: string;
            longName?: string;
            exchangeName?: string;
            currency?: string;
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            previousClose?: number;
            regularMarketChangePercent?: number;
            regularMarketTime?: number;
            fiftyTwoWeekHigh?: number;
            fiftyTwoWeekLow?: number;
          };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              high?: Array<number | null>;
              low?: Array<number | null>;
              close?: Array<number | null>;
              volume?: Array<number | null>;
            }>;
          };
        }>;
      };
    };

    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    const timestamps = result?.timestamp || [];
    const quote = result?.indicators?.quote?.[0];
    if (!meta || !quote?.close || timestamps.length < 30) return null;

    const closes: number[] = [];
    const highs: number[] = [];
    const lows: number[] = [];
    const volumes: number[] = [];
    let lastTs = timestamps[timestamps.length - 1];

    for (let i = 0; i < timestamps.length; i++) {
      const c = quote.close[i];
      if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) continue;
      closes.push(c);
      highs.push(typeof quote.high?.[i] === 'number' ? (quote.high[i] as number) : c);
      lows.push(typeof quote.low?.[i] === 'number' ? (quote.low[i] as number) : c);
      volumes.push(typeof quote.volume?.[i] === 'number' ? (quote.volume[i] as number) : 0);
      lastTs = timestamps[i];
    }

    if (closes.length < 30) return null;

    const latestClose = closes[closes.length - 1];
    const prevBarClose = closes[closes.length - 2] || latestClose;
    const currentPrice = round2(meta.regularMarketPrice || latestClose);
    const prevClose = round2(
      meta.previousClose ||
        (Math.abs(currentPrice - latestClose) > 0.01 ? latestClose : prevBarClose)
    );
    const dayChangePct =
      typeof meta.regularMarketChangePercent === 'number'
        ? round2(meta.regularMarketChangePercent)
        : prevClose > 0
          ? round2(((currentPrice - prevClose) / prevClose) * 100)
          : 0;

    const ema20Arr = calcEmaSeries(closes, 20);
    const ema50Arr = calcEmaSeries(closes, 50);
    const ema200Arr = calcEmaSeries(closes, Math.min(200, closes.length));
    const ema12Arr = calcEmaSeries(closes, 12);
    const ema26Arr = calcEmaSeries(closes, 26);
    const macdLine = ema12Arr.map((v, idx) => v - ema26Arr[idx]);
    const macdSigArr = calcEmaSeries(macdLine, 9);

    const lastIdx = closes.length - 1;
    const ema20 = round2(ema20Arr[lastIdx]);
    const ema50 = round2(ema50Arr[lastIdx]);
    const ema200 = round2(ema200Arr[lastIdx]);
    const macd = round2(macdLine[lastIdx]);
    const macdSignal = round2(macdSigArr[lastIdx]);
    const macdHist = round2(macd - macdSignal);
    const rsi14 = calcRsi14(closes);
    const atr14 = calcAtr14(highs, lows, closes);

    const recentVols = volumes.slice(-21, -1).filter((v) => v > 0);
    const avgVolume20 =
      recentVols.length > 0
        ? Math.round(recentVols.reduce((a, b) => a + b, 0) / recentVols.length)
        : 0;
    const latestVolume = volumes[lastIdx] || avgVolume20;
    const recent3Vols = volumes.slice(-3).filter((v) => v > 0);
    const avg3Vol =
      recent3Vols.length > 0
        ? recent3Vols.reduce((a, b) => a + b, 0) / recent3Vols.length
        : latestVolume;
    const volumeRatio = avgVolume20 > 0 ? round2(Math.max(latestVolume, avg3Vol) / avgVolume20) : 1;

    const currency: '₹' | '$' =
      meta.currency === 'INR' || yahooSymbol.endsWith('.NS') || yahooSymbol.endsWith('.BO')
        ? '₹'
        : '$';
    const avgTurnoverCr =
      currency === '₹'
        ? round2((avgVolume20 * currentPrice) / 1e7)
        : round2((avgVolume20 * currentPrice) / 1e6);

    const low10 = round2(Math.min(...lows.slice(-10)));
    const high20 = round2(Math.max(...highs.slice(-20)));
    const low20 = round2(Math.min(...lows.slice(-20)));
    const low50 = round2(Math.min(...lows.slice(-50)));
    const high60 = round2(Math.max(...highs.slice(-60)));
    const low60 = round2(Math.min(...lows.slice(-60)));
    const high120 = round2(Math.max(...highs.slice(-120)));
    const low120 = round2(Math.min(...lows.slice(-120)));
    const fiftyTwoWeekHigh = round2(meta.fiftyTwoWeekHigh || Math.max(...highs));
    const fiftyTwoWeekLow = round2(meta.fiftyTwoWeekLow || Math.min(...lows));
    const atrPct = currentPrice > 0 ? round2((atr14 / currentPrice) * 100) : 2.0;
    const avgWeeklyMovePct = calcAvgWeeklyMovePct(closes);
    const { pivotLows, pivotHighs } = extractPivotLevels(highs, lows, currentPrice);

    const asOfDate = new Date((meta.regularMarketTime || lastTs) * 1000)
      .toISOString()
      .slice(0, 10);

    const metrics: ChartMetrics = {
      symbol: cleanSym,
      yahooSymbol,
      companyName: meta.longName || meta.shortName || cleanSym,
      exchange: currency === '₹' ? 'NSE' : meta.exchangeName || 'US',
      currency,
      currentPrice,
      prevClose,
      dayChangePct,
      asOfDate,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      ema20,
      ema50,
      ema200,
      rsi14,
      macd,
      macdSignal,
      macdHist,
      atr14,
      atrPct,
      avgWeeklyMovePct,
      latestVolume,
      avgVolume20,
      volumeRatio,
      avgTurnoverCr,
      low10,
      high20,
      low20,
      low50,
      high60,
      low60,
      high120,
      low120,
      pivotLows,
      pivotHighs,
      ret1W: pctReturn(closes, 5),
      ret1M: pctReturn(closes, 21),
      ret3M: pctReturn(closes, 63),
      ret1Y: pctReturn(closes, Math.min(245, closes.length - 1)),
      chartUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}/`,
    };
    chartMetricsCache.set(yahooSymbol, { data: metrics, ts: Date.now() });
    return metrics;
  } catch {
    return null;
  }
}

export async function resolveSymbolQuery(
  query: string,
  market: SwingMarket
): Promise<{ symbol: string; companyName: string; sector: string; market: SwingMarket } | null> {
  const clean = query.trim();
  if (!clean) return null;

  // Check local Nifty 500, Nifty 1000 & US catalog first
  const upper = clean.toUpperCase().replace(/\.(NS|BO)$/i, '');
  const localNse = [...NIFTY_500_UNIVERSE, ...NIFTY_1000_HIGH_BETA_UNIVERSE].find(
    (s) => s.symbol === upper || s.name.toUpperCase().includes(upper)
  );
  if (localNse && market === 'NSE') {
    return { symbol: localNse.symbol, companyName: localNse.name, sector: localNse.sector, market: 'NSE' };
  }
  const localUs = US_LIQUID_UNIVERSE.find(
    (s) => s.symbol === upper || s.name.toUpperCase().includes(upper)
  );
  if (localUs) {
    return { symbol: localUs.symbol, companyName: localUs.name, sector: localUs.sector, market: 'US' };
  }

  // Fallback to Yahoo Finance Search API for any stock name/symbol
  try {
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      clean
    )}&quotesCount=6&newsCount=0`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        quotes?: Array<{
          symbol?: string;
          shortname?: string;
          longname?: string;
          exchDisp?: string;
          sectorDisp?: string;
          quoteType?: string;
        }>;
      };
      const quotes = (data.quotes || []).filter((q) => q.quoteType === 'EQUITY' && q.symbol);
      const preferred =
        market === 'NSE'
          ? quotes.find((q) => q.symbol?.endsWith('.NS')) ||
            quotes.find((q) => q.symbol?.endsWith('.BO')) ||
            quotes[0]
          : quotes.find((q) => !q.symbol?.includes('.')) || quotes[0];

      if (preferred?.symbol) {
        const isIndian = preferred.symbol.endsWith('.NS') || preferred.symbol.endsWith('.BO');
        return {
          symbol: preferred.symbol.replace(/\.(NS|BO)$/i, '').toUpperCase(),
          companyName: preferred.longname || preferred.shortname || preferred.symbol,
          sector: preferred.sectorDisp || 'Equities',
          market: isIndian ? 'NSE' : 'US',
        };
      }
    }
  } catch {
    // ignore search error and fall back to raw upper symbol
  }

  return {
    symbol: upper.replace(/[^A-Z0-9&-]/g, ''),
    companyName: clean,
    sector: 'Equities',
    market,
  };
}

const SEVERE_RED_FLAG_WORDS = [
  'sebi',
  'fraud',
  'raid',
  'ed raid',
  'penalty',
  'ban',
  'probe',
  'default',
  'lawsuit',
  'show cause',
  'pledge',
  'insider',
  'promoter sells',
  'resigns',
];

const NEGATIVE_NEWS_WORDS = [
  ...SEVERE_RED_FLAG_WORDS,
  'downgrade',
  'sell rating',
  'target cut',
  'slump',
  'crash',
  'plunge',
  'tumbles',
  'loss widens',
  'net loss',
  'misses',
  'weak',
  'profit drops',
  'profit falls',
  'warning',
  'fine',
  'strike',
  'halt',
  'decline',
];

const POSITIVE_NEWS_WORDS = [
  'order win',
  'order',
  'bagged',
  'contract',
  'upgrade',
  'buy rating',
  'outperform',
  'target raised',
  'profit rises',
  'profit jumps',
  'profit up',
  'revenue rises',
  'surge',
  'rally',
  'record',
  'all-time high',
  '52-week high',
  'breakout',
  'expansion',
  'capex',
  'beats',
  'dividend',
  'buyback',
  'bonus',
  'partnership',
  'approval',
  'nod',
  'stake buy',
  'strong',
  'gains',
];

export interface NewsSentimentSummary {
  items: StockNewsItem[];
  sources: GroundingSource[];
  hasNegativeRedFlag: boolean;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentLabel: 'Bullish' | 'Neutral' | 'Caution' | 'Negative';
  sentimentScore: number; // Real headline-derived score (3.5 to 9.2)
}

const newsCache = new Map<string, { data: NewsSentimentSummary; ts: number }>();

function decodeXml(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function fetchGoogleNews(
  symbol: string,
  companyName: string,
  market: SwingMarket
): Promise<NewsSentimentSummary> {
  const cacheKey = `${market}:${symbol.toUpperCase()}`;
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 15 * 60 * 1000) {
    return cached.data;
  }

  const q =
    market === 'NSE'
      ? `${symbol} ${companyName.split(' ')[0]} NSE stock`
      : `${symbol} stock news`;
  const rssUrl =
    market === 'NSE'
      ? `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`
      : `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

  const emptySummary: NewsSentimentSummary = {
    items: [],
    sources: [],
    hasNegativeRedFlag: false,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    sentimentLabel: 'Neutral',
    sentimentScore: 6.5,
  };

  try {
    const res = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return emptySummary;

    const xml = await res.text();
    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 5);
    const items: StockNewsItem[] = [];
    const sources: GroundingSource[] = [];
    let hasNegativeRedFlag = false;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (let i = 0; i < itemMatches.length; i++) {
      const block = itemMatches[i][1];
      const rawTitle = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
      const rawLink = block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
      const rawDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '';
      const rawSource = block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || 'News';

      const title = decodeXml(rawTitle).replace(/\s+-\s+[^-]+$/, '');
      const sourceName = decodeXml(rawSource);
      const link = decodeXml(rawLink);
      const dateObj = rawDate ? new Date(rawDate) : new Date();
      const dateStr = Number.isNaN(dateObj.getTime())
        ? 'Recent'
        : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const lower = title.toLowerCase();
      let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      let importance = 6;
      const isSevere = SEVERE_RED_FLAG_WORDS.some((w) => lower.includes(w));
      const isNegative = isSevere || NEGATIVE_NEWS_WORDS.some((w) => lower.includes(w));
      const isPositive = !isSevere && POSITIVE_NEWS_WORDS.some((w) => lower.includes(w));

      if (isNegative && !isPositive) {
        sentiment = 'Negative';
        importance = isSevere ? 9 : 8;
        negativeCount++;
        if (isSevere) hasNegativeRedFlag = true;
      } else if (isPositive) {
        sentiment = 'Positive';
        importance = 7;
        positiveCount++;
      } else {
        neutralCount++;
      }

      if (title) {
        items.push({
          title,
          date: dateStr,
          summary: `${sourceName}: ${title}`,
          importance,
          sentiment,
        });
        if (link) {
          sources.push({
            index: i + 1,
            title,
            uri: link,
            domain: sourceName.toLowerCase().replace(/\s+/g, '') || 'news.google.com',
          });
        }
      }
    }

    // Multiple non-severe negative headlines also trigger caution red flag
    if (negativeCount >= 2) hasNegativeRedFlag = true;

    // Quantitative headline sentiment score (3.5 to 9.2)
    let sentimentScore = items.length > 0 ? 6.8 : 6.5;
    sentimentScore += Math.min(2.2, positiveCount * 0.8);
    sentimentScore -= negativeCount * 1.45;
    if (hasNegativeRedFlag) sentimentScore -= 0.7;
    sentimentScore = round2(Math.max(3.5, Math.min(9.2, sentimentScore)));

    const sentimentLabel: NewsSentimentSummary['sentimentLabel'] =
      hasNegativeRedFlag || negativeCount > positiveCount
        ? negativeCount >= 2 || hasNegativeRedFlag
          ? 'Negative'
          : 'Caution'
        : positiveCount > 0 && negativeCount === 0
          ? 'Bullish'
          : 'Neutral';

    const result: NewsSentimentSummary = {
      items,
      sources,
      hasNegativeRedFlag,
      positiveCount,
      negativeCount,
      neutralCount,
      sentimentLabel,
      sentimentScore,
    };
    newsCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch {
    return emptySummary;
  }
}

function fmtCurrency(val: number, curr: '₹' | '$'): string {
  return `${curr}${val.toLocaleString(curr === '₹' ? 'en-IN' : 'en-US', {
    maximumFractionDigits: 2,
  })}`;
}

export function buildSectionRiskLevels(
  m: ChartMetrics,
  section: TradingSection,
  universe: UniverseMode = 'nifty500'
): {
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  holdingWindow: string;
  expiryDays: number;
  slLogic: string;
  targetLogic: string;
  expiryLogic: string;
} {
  const p = m.currentPrice;
  const atr = Math.max(m.atr14, p * 0.008);
  const isHighBeta = universe === 'nifty1000';

  // Entry zone anchored to stock's own 20 EMA pullback & ATR intraday band
  const entryMin = round2(
    Math.min(p * 0.996, Math.max(m.ema20 * 0.992, p - atr * 0.55))
  );
  const entryMax = round2(p + atr * 0.25);
  const mid = (entryMin + entryMax) / 2;

  // =========================================================================
  // 1. DATA-DRIVEN STOP LOSS: Anchor to THIS stock's real structural support + ATR noise buffer
  // =========================================================================
  interface SupportOption {
    price: number;
    label: string;
  }

  const supportCandidates: SupportOption[] = [];
  if (section === 'mtf') {
    if (m.low10 < entryMin) {
      supportCandidates.push({ price: round2(m.low10 - atr * 0.3), label: `10D Swing Low ${fmtCurrency(m.low10, m.currency)}` });
    }
    if (m.ema20 < entryMin) {
      supportCandidates.push({ price: round2(m.ema20 - atr * 0.45), label: `20 EMA ${fmtCurrency(m.ema20, m.currency)}` });
    }
    for (const pl of m.pivotLows.slice(0, 2)) {
      supportCandidates.push({ price: round2(pl - atr * 0.25), label: `Pivot Support ${fmtCurrency(pl, m.currency)}` });
    }
  } else if (section === 'swing') {
    for (const pl of m.pivotLows.slice(0, 3)) {
      supportCandidates.push({ price: round2(pl - atr * 0.35), label: `Swing Pivot ${fmtCurrency(pl, m.currency)}` });
    }
    if (m.low20 < entryMin) {
      supportCandidates.push({ price: round2(m.low20 - atr * 0.35), label: `20D Low ${fmtCurrency(m.low20, m.currency)}` });
    }
    if (m.ema20 < entryMin) {
      supportCandidates.push({ price: round2(m.ema20 - atr * 0.65), label: `20 EMA ${fmtCurrency(m.ema20, m.currency)}` });
    }
    if (m.ema50 < entryMin) {
      supportCandidates.push({ price: round2(m.ema50 - atr * 0.45), label: `50 EMA ${fmtCurrency(m.ema50, m.currency)}` });
    }
  } else if (section === 'short_term') {
    if (m.ema50 < entryMin) {
      supportCandidates.push({ price: round2(m.ema50 - atr * 0.75), label: `50 EMA ${fmtCurrency(m.ema50, m.currency)}` });
    }
    for (const pl of m.pivotLows.slice(0, 4)) {
      supportCandidates.push({ price: round2(pl - atr * 0.45), label: `Structural Pivot ${fmtCurrency(pl, m.currency)}` });
    }
    if (m.low50 < entryMin) {
      supportCandidates.push({ price: round2(m.low50 - atr * 0.4), label: `50D Demand Low ${fmtCurrency(m.low50, m.currency)}` });
    }
    if (m.low60 < entryMin) {
      supportCandidates.push({ price: round2(m.low60 - atr * 0.4), label: `60D Base Low ${fmtCurrency(m.low60, m.currency)}` });
    }
  } else {
    // long_term (> 1 Year): Major structural trend invalidation (200 EMA / 120D Demand Zone)
    if (m.ema200 < entryMin) {
      supportCandidates.push({ price: round2(m.ema200 - atr * 1.0), label: `200 EMA Major Support ${fmtCurrency(m.ema200, m.currency)}` });
    }
    if (m.low120 < entryMin) {
      supportCandidates.push({ price: round2(m.low120 - atr * 0.75), label: `120D Demand Low ${fmtCurrency(m.low120, m.currency)}` });
    }
    for (const pl of m.pivotLows) {
      supportCandidates.push({ price: round2(pl - atr * 0.75), label: `Major Swing Low ${fmtCurrency(pl, m.currency)}` });
    }
  }

  // Volatility-calibrated noise floor & discipline ceiling derived directly from THIS stock's ATR%
  const atrPctFrac = atr / mid;
  let minRiskFrac = Math.max(0.03, atrPctFrac * 1.5);
  let maxRiskFrac = Math.min(0.085, atrPctFrac * 3.4);
  if (section === 'mtf') {
    minRiskFrac = Math.max(0.022, atrPctFrac * 1.25);
    maxRiskFrac = Math.min(isHighBeta ? 0.062 : 0.052, Math.max(minRiskFrac + 0.015, atrPctFrac * 2.4));
  } else if (section === 'short_term') {
    minRiskFrac = Math.max(0.045, atrPctFrac * 2.0);
    maxRiskFrac = Math.min(isHighBeta ? 0.135 : 0.11, Math.max(minRiskFrac + 0.025, atrPctFrac * 4.6));
  } else if (section === 'long_term') {
    minRiskFrac = Math.max(0.1, atrPctFrac * 3.8);
    maxRiskFrac = Math.min(isHighBeta ? 0.24 : 0.2, Math.max(minRiskFrac + 0.05, atrPctFrac * 8.5));
  }

  const slUpperBound = round2(mid * (1 - minRiskFrac)); // Tightest allowed SL (beyond daily noise)
  const slLowerBound = round2(mid * (1 - maxRiskFrac)); // Widest disciplined SL

  // Pick the closest valid real chart support sitting inside [slLowerBound, slUpperBound]
  const validSupports = supportCandidates
    .filter((c) => c.price <= slUpperBound && c.price >= slLowerBound)
    .sort((a, b) => b.price - a.price);

  let stopLoss: number;
  let slLogic: string;
  if (validSupports.length > 0) {
    // For short_term/long_term prefer deeper clean structural support if multiple exist
    const chosen =
      (section === 'short_term' || section === 'long_term') && validSupports.length > 1
        ? validSupports[1]
        : validSupports[0];
    stopLoss = chosen.price;
    slLogic = `${chosen.label} − ATR buffer`;
  } else {
    const atrMult =
      section === 'mtf' ? 1.5 : section === 'swing' ? 2.0 : section === 'short_term' ? 2.8 : 4.8;
    const atrSl = round2(mid - atr * atrMult);
    stopLoss = round2(Math.max(slLowerBound, Math.min(slUpperBound, atrSl)));
    slLogic = `${atrMult}× Daily ATR (${m.atrPct.toFixed(1)}%/day) volatility stop`;
  }

  const risk = Math.max(mid - stopLoss, mid * 0.015);

  // =========================================================================
  // 2. DATA-DRIVEN TARGET 1 & TARGET 2: Real Overhead Resistances + Measured Base Move
  // =========================================================================
  interface TargetOption {
    price: number;
    label: string;
  }

  const base20 = Math.max(m.high20 - m.low20, atr * 3);
  const base60 = Math.max(m.high60 - m.low60, atr * 5.5);
  const base120 = Math.max(m.high120 - m.low120, atr * 9);

  const overheadCandidates: TargetOption[] = [];
  for (const ph of m.pivotHighs) {
    if (ph > mid * 1.015) {
      overheadCandidates.push({ price: ph, label: `Chart Resistance ${fmtCurrency(ph, m.currency)}` });
    }
  }
  if (m.high20 > mid * 1.02) {
    overheadCandidates.push({ price: m.high20, label: `20D High ${fmtCurrency(m.high20, m.currency)}` });
  }
  if (m.high60 > mid * 1.03) {
    overheadCandidates.push({ price: m.high60, label: `60D High ${fmtCurrency(m.high60, m.currency)}` });
  }
  if (m.high120 > mid * 1.04) {
    overheadCandidates.push({ price: m.high120, label: `120D High ${fmtCurrency(m.high120, m.currency)}` });
  }
  if (m.fiftyTwoWeekHigh > mid * 1.025) {
    overheadCandidates.push({ price: m.fiftyTwoWeekHigh, label: `52W High ${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)}` });
  }

  // Measured-move & Fibonacci extensions from THIS stock's real consolidation base
  if (section === 'mtf') {
    overheadCandidates.push({
      price: round2(mid + base20 * 0.618),
      label: `20D Base 0.618 Move`,
    });
    overheadCandidates.push({
      price: round2(mid + base20 * 1.0),
      label: `20D Range Breakout`,
    });
    overheadCandidates.push({
      price: round2(mid + base20 * 1.272),
      label: `20D Fib 1.272 Ext`,
    });
  } else if (section === 'swing') {
    overheadCandidates.push({
      price: round2(mid + base20 * 0.786),
      label: `20D Base 0.786 Move`,
    });
    overheadCandidates.push({
      price: round2(mid + base60 * 0.618),
      label: `60D Base 0.618 Move`,
    });
    overheadCandidates.push({
      price: round2(mid + base60 * 1.0),
      label: `60D Base Measured Move`,
    });
  } else if (section === 'short_term') {
    overheadCandidates.push({
      price: round2(mid + base60 * 0.786),
      label: `60D Base 0.786 Ext`,
    });
    overheadCandidates.push({
      price: round2(mid + base60 * 1.272),
      label: `60D Fib 1.272 Ext`,
    });
    overheadCandidates.push({
      price: round2(mid + base120 * 1.0),
      label: `120D Base Measured Move`,
    });
  } else {
    // long_term (> 1 Year): 120D structural base + stock's own 1Y compounding rate
    const annualizedPace = Math.max(0.22, Math.min(0.55, Math.max(m.ret1Y / 100, m.atrPct * 0.14)));
    overheadCandidates.push({
      price: round2(mid + base120 * 1.272),
      label: `120D Fib 1.272 Structural`,
    });
    overheadCandidates.push({
      price: round2(mid * (1 + annualizedPace)),
      label: `1Y Structural Trend (+${Math.round(annualizedPace * 100)}%)`,
    });
    overheadCandidates.push({
      price: round2(mid + base120 * 2.0),
      label: `120D Double-Base Target`,
    });
    overheadCandidates.push({
      price: round2(mid * (1 + annualizedPace * 1.65)),
      label: `Multi-Year Compounding (+${Math.round(annualizedPace * 165)}%)`,
    });
  }

  // Realistic reachability envelope for THIS stock's ATR within each section's exact time horizon
  // (Prevents impossible "hava me" targets that a stock's volatility can never reach in time!)
  let t1MinPrice: number;
  let t1MaxPrice: number;
  let t2MinPrice: number;
  let t2MaxPrice: number;

  if (section === 'mtf') {
    // Max 14 calendar days (~10 trading sessions)
    t1MinPrice = round2(mid + Math.max(risk * 1.2, atr * 1.9));
    t1MaxPrice = round2(mid + Math.max(risk * 2.2, atr * 4.0));
    t2MinPrice = round2(mid + Math.max(risk * 1.85, atr * 3.0));
    t2MaxPrice = round2(mid + Math.max(risk * 3.0, atr * 5.6));
  } else if (section === 'swing') {
    // Strictly <= 1 Month (<= 30 calendar days, ~21 trading sessions)
    t1MinPrice = round2(mid + Math.max(risk * 1.3, atr * 2.8));
    t1MaxPrice = round2(mid + Math.max(risk * 2.4, atr * 6.0));
    t2MinPrice = round2(mid + Math.max(risk * 2.0, atr * 4.5));
    t2MaxPrice = round2(mid + Math.max(risk * 3.5, atr * 9.2));
  } else if (section === 'short_term') {
    // Strictly < 3 Months (32–88 calendar days, ~22–60 trading sessions)
    t1MinPrice = round2(mid + Math.max(risk * 1.45, atr * 5.2));
    t1MaxPrice = round2(mid + Math.max(risk * 2.8, atr * 13.0));
    t2MinPrice = round2(mid + Math.max(risk * 2.2, atr * 8.5));
    t2MaxPrice = round2(mid + Math.max(risk * 4.2, atr * 20.5));
  } else {
    // Strictly > 1 Year (>= 366 calendar days, ~255+ trading sessions)
    t1MinPrice = round2(mid + Math.max(risk * 1.8, mid * 0.22));
    t1MaxPrice = round2(mid + Math.max(risk * 3.2, mid * 0.48));
    t2MinPrice = round2(mid + Math.max(risk * 2.8, mid * 0.4));
    t2MaxPrice = round2(mid + Math.max(risk * 5.5, mid * 0.95));
  }

  const sortedTargets = [...overheadCandidates].sort((a, b) => a.price - b.price);
  const t1Pick =
    sortedTargets.find((t) => t.price >= t1MinPrice && t.price <= t1MaxPrice) || {
      price: round2((t1MinPrice + Math.min(t1MaxPrice, t1MinPrice + atr * 2.5)) / 2),
      label: `ATR Trend Projection`,
    };

  const t2Floor = Math.max(t2MinPrice, round2(t1Pick.price + Math.max(atr * 1.4, risk * 0.65)));
  const t2Pick =
    sortedTargets.find((t) => t.price >= t2Floor && t.price <= t2MaxPrice) || {
      price: round2(Math.min(t2MaxPrice, Math.max(t2Floor, mid + risk * (section === 'long_term' ? 3.2 : 2.3)))),
      label: `Measured Move Projection`,
    };

  const target1 = t1Pick.price;
  const target2 = Math.max(t2Pick.price, round2(target1 + atr * 1.2));
  // Blended R:R matching the actual exit rule (50% book at Target 1 + 50% trail to Target 2)
  const blendedTarget = (target1 + target2) / 2;
  const rr = risk > 0 ? ((blendedTarget - mid) / risk).toFixed(1) : '2.0';
  const targetLogic = `T1: ${t1Pick.label} · T2: ${t2Pick.label}`;

  // =========================================================================
  // 3. DATA-DRIVEN CALL EXPIRY: Computed from THIS stock's real daily velocity & Target 2 distance
  // Strictly respects: MTF <= 14d | Swing <= 1 Month (<=30d) | Short Term < 3 Months (<90d) | Long Term > 1 Year (>365d)
  // =========================================================================
  const trendEfficiency =
    section === 'long_term'
      ? 0.14
      : m.macdHist > 0 && m.rsi14 >= 52 && m.rsi14 <= 72
        ? 0.36
        : 0.28;

  const atrDailyNet = atr * trendEfficiency;
  const weeklyDerivedDaily = (mid * (m.avgWeeklyMovePct / 100)) / 5 * 0.42;
  const effectiveDailyMove = Math.max(atrDailyNet, weeklyDerivedDaily, mid * 0.0022);

  // Trading days required to cover (target2 - mid) + 18% realistic consolidation buffer -> calendar days
  const estTradingDays = Math.ceil(((target2 - mid) / effectiveDailyMove) * 1.18);
  const rawCalendarDays = Math.round(estTradingDays * 1.45);

  let expiryDays: number;
  let holdingWindow: string;

  if (section === 'mtf') {
    expiryDays = Math.max(5, Math.min(14, rawCalendarDays));
    holdingWindow = `~${expiryDays} Days (MTF ≤14d)`;
  } else if (section === 'swing') {
    // STRICT RULE: Swing must be within 1 month (<= 30 calendar days)
    expiryDays = Math.max(7, Math.min(30, rawCalendarDays));
    holdingWindow = `~${expiryDays} Days (Swing ≤1M)`;
  } else if (section === 'short_term') {
    // STRICT RULE: Short Term must be > 1 month and strictly < 3 months (32–88 calendar days)
    expiryDays = Math.max(32, Math.min(88, rawCalendarDays));
    const months = (expiryDays / 30).toFixed(1);
    holdingWindow = `~${expiryDays} Days (${months}M · <3M)`;
  } else {
    // STRICT RULE: Long Term must be strictly > 1 year (370–730 calendar days, 13–24 months)
    const annualPaceFrac = Math.max(0.18, Math.min(0.45, m.ret1Y > 12 ? m.ret1Y / 100 : m.atrPct * 0.12));
    const targetMoveFrac = (target2 - mid) / mid;
    const estYears = Math.max(1.05, Math.min(2.0, (targetMoveFrac / annualPaceFrac) * 1.15));
    expiryDays = Math.max(370, Math.min(730, Math.round(estYears * 365)));
    const months = Math.round(expiryDays / 30);
    holdingWindow = `~${months} Months (>1 Yr)`;
  }

  const expiryLogic = `ATR ${m.atrPct.toFixed(1)}%/d · 5D Move ${m.avgWeeklyMovePct.toFixed(1)}% → ~${expiryDays}d to Target`;

  return {
    entryMin: Math.min(entryMin, entryMax),
    entryMax: Math.max(entryMin, entryMax),
    stopLoss,
    target1,
    target2,
    riskReward: `1 : ${rr}`,
    holdingWindow,
    expiryDays,
    slLogic,
    targetLogic,
    expiryLogic,
  };
}

function evaluateCandidate(
  stock: UniverseStock,
  m: ChartMetrics,
  benchRet1M: number,
  benchRet3M: number,
  section: TradingSection,
  market: SwingMarket,
  universe: UniverseMode = 'nifty500',
  f?: LiveFundamentals | null,
  news?: NewsSentimentSummary | null
): {
  score: number;
  passCount: number;
  hdRating: number;
  parameters: ParameterCheck[];
  angleScores: {
    technical: number;
    priceAction: number;
    fundamentals: number;
    news: number;
    safety: number;
  };
} {
  const isNifty1000 = market === 'NSE' && universe === 'nifty1000';
  const universeLabel = market === 'NSE' ? (isNifty1000 ? 'Nifty 1000 (High Risk)' : 'Nifty 500 (Low Risk)') : 'US Liquid';
  const rs1M = round2(m.ret1M - benchRet1M);
  const rs3M = round2(m.ret3M - benchRet3M);
  const distFrom52High = m.fiftyTwoWeekHigh > 0 ? round2(((m.fiftyTwoWeekHigh - m.currentPrice) / m.fiftyTwoWeekHigh) * 100) : 15;
  const above20 = m.currentPrice >= m.ema20;
  const above50 = m.currentPrice >= m.ema50;
  const above200 = m.currentPrice >= m.ema200;
  const goldenAlign = above50 && above200 && m.ema50 >= m.ema200 * 0.99;
  const isFin = isFinancialSector(stock.sector);

  // Real Live Fundamental Diagnostics (never static 8.2 when live exchange fundamentals exist!)
  const hasLiveGrowth = f && (f.revenueGrowthPct !== null || f.earningsGrowthPct !== null);
  const revG = f?.revenueGrowthPct ?? null;
  const earnG = f?.earningsGrowthPct ?? null;
  const growthStatus: ParameterStatus = hasLiveGrowth
    ? (earnG !== null && earnG >= 8) || (revG !== null && revG >= 10 && (earnG === null || earnG >= 0))
      ? 'pass'
      : (earnG !== null && earnG < -12) || (revG !== null && revG < -8)
        ? 'fail'
        : 'caution'
    : 'caution';
  const growthValueText = hasLiveGrowth
    ? [
        revG !== null ? `Rev ${revG >= 0 ? '+' : ''}${revG.toFixed(1)}%` : '',
        earnG !== null ? `PAT ${earnG >= 0 ? '+' : ''}${earnG.toFixed(1)}%` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : stock.growthHint;
  const growthNoteText = hasLiveGrowth
    ? growthStatus === 'pass'
      ? 'Live quarterly sales & profit growth strong hai.'
      : growthStatus === 'fail'
        ? 'Live quarterly earnings slowdown / contraction dikh raha hai.'
        : 'Moderate quarterly growth — next result track karein.'
    : 'Live quarterly feed pending — latest results verify karein.';

  const hasLiveRoeOrPe = f && (f.roePct !== null || f.debtToEquityRatio !== null || f.trailingPe !== null);
  const roePct = f?.roePct ?? null;
  const dte = f?.debtToEquityRatio ?? null;
  const pe = f?.trailingPe ?? null;
  const debtBad = !isFin && dte !== null && dte > 1.5;
  const debtGood = isFin || dte === null || dte <= 0.8;
  const roeStatus: ParameterStatus = hasLiveRoeOrPe
    ? (roePct !== null && roePct >= 14 && debtGood) || (roePct === null && debtGood && pe !== null && pe > 0 && pe <= 55)
      ? 'pass'
      : (roePct !== null && roePct < 7) || debtBad
        ? 'fail'
        : 'caution'
    : 'caution';
  const roeValueText = hasLiveRoeOrPe
    ? [
        roePct !== null ? `ROE ${roePct.toFixed(1)}%` : '',
        !isFin && dte !== null ? `D/E ${dte.toFixed(2)}x` : '',
        pe !== null ? `P/E ${pe.toFixed(1)}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : stock.roeHint;
  const roeNoteText = hasLiveRoeOrPe
    ? roeStatus === 'pass'
      ? 'Live balance sheet quality aur capital efficiency healthy hai.'
      : roeStatus === 'fail'
        ? 'Low ROE ya high debt-to-equity risk detect hua hai.'
        : 'Average ROE/valuation — risk sizing moderate rakhein.'
    : 'Verify live ROE/Debt on screener before sizing up.';

  // Real quantitative Fundamental Score (3.5 to 9.6)
  let fundScore = 6.2;
  if (f) {
    let fs = 5.6;
    if (roePct !== null) {
      if (roePct >= 22) fs += 1.6;
      else if (roePct >= 15) fs += 1.1;
      else if (roePct >= 10) fs += 0.4;
      else if (roePct < 7) fs -= 1.2;
    }
    if (earnG !== null) {
      if (earnG >= 20) fs += 1.1;
      else if (earnG >= 8) fs += 0.6;
      else if (earnG < -10) fs -= 1.2;
    }
    if (revG !== null) {
      if (revG >= 15) fs += 0.7;
      else if (revG >= 6) fs += 0.35;
      else if (revG < -5) fs -= 0.7;
    }
    if (!isFin && dte !== null) {
      if (dte <= 0.4) fs += 0.6;
      else if (dte <= 0.9) fs += 0.2;
      else if (dte > 1.5) fs -= 1.1;
    }
    if (f.profitMarginPct !== null) {
      if (f.profitMarginPct >= 15) fs += 0.4;
      else if (f.profitMarginPct < 3) fs -= 0.6;
    }
    fundScore = round2(Math.max(3.5, Math.min(9.6, fs)));
  }

  // Parameter checks aligned directly to exact section blueprint
  const parameters: ParameterCheck[] = [];

  if (section === 'short_term') {
    const minTurnover = market === 'NSE' ? (isNifty1000 ? 5 : 15) : 50;
    const liqOk = m.avgTurnoverCr >= minTurnover;
    parameters.push({
      category: 'Safety',
      name: `${universeLabel} & Liquidity`,
      value:
        market === 'NSE'
          ? `${isNifty1000 ? 'Nifty 1000' : 'Nifty 500'} · ₹${m.avgTurnoverCr.toFixed(0)} Cr/day`
          : `Liquid US · $${m.avgTurnoverCr.toFixed(0)}M/day`,
      status: liqOk ? 'pass' : 'caution',
      note: liqOk
        ? isNifty1000
          ? 'High-beta Nifty 1000 growth stock — fast move, strict SL zaroori.'
          : 'Official Nifty 500 liquid stock — lower volatility, clean entry/exit.'
        : 'Moderate turnover — limit order use karein.',
    });

    parameters.push({
      category: 'Fundamental',
      name: 'Quarterly Sales & Profit',
      value: growthValueText,
      status: growthStatus,
      note: growthNoteText,
    });

    const emaStatus: ParameterStatus = goldenAlign ? 'pass' : above50 || above200 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: '50 & 200 EMA Alignment',
      value: `50E ${fmtCurrency(m.ema50, m.currency)} · 200E ${fmtCurrency(m.ema200, m.currency)}`,
      status: emaStatus,
      note:
        emaStatus === 'pass'
          ? 'Price 50 EMA aur 200 EMA dono ke upar strong uptrend me hai.'
          : emaStatus === 'caution'
            ? 'Mixed EMA alignment — breakout confirmation zaroori.'
            : 'Price 50/200 EMA ke neeche — weak trend.',
    });

    const rsStatus: ParameterStatus = rs3M > 2 || rs1M > 1.5 ? 'pass' : rs3M > -3 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: 'Relative Strength vs Nifty 50',
      value: `1M ${rs1M >= 0 ? '+' : ''}${rs1M}% · 3M ${rs3M >= 0 ? '+' : ''}${rs3M}%`,
      status: rsStatus,
      note:
        rsStatus === 'pass'
          ? 'Nifty 50 benchmark se clearly outperform kar raha hai.'
          : 'Index ke barabar ya thoda slow move kar raha hai.',
    });

    const nearBreakout = distFrom52High <= (isNifty1000 ? 18 : 14) && m.currentPrice >= m.low20 * 1.02;
    const baseStatus: ParameterStatus = nearBreakout && above20 ? 'pass' : distFrom52High <= 26 ? 'caution' : 'fail';
    parameters.push({
      category: 'Price Action',
      name: 'Weekly Base Breakout',
      value: `${distFrom52High}% below 52W High (${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)})`,
      status: baseStatus,
      note:
        baseStatus === 'pass'
          ? '52-week high zone ke paas strong base & breakout structure.'
          : 'Base build ho raha hai — resistance ke paas patience rakhein.',
    });

    const rsiUpper = isNifty1000 ? 74 : 70;
    const rsiSweet = m.rsi14 >= 48 && m.rsi14 <= rsiUpper;
    const rsiOverbought = m.rsi14 > (isNifty1000 ? 78 : 75);
    const volGood = m.volumeRatio >= 0.95;
    const rsiStatus: ParameterStatus =
      rsiSweet && volGood ? 'pass' : rsiOverbought || m.rsi14 < 38 ? 'fail' : 'caution';
    parameters.push({
      category: 'Technical',
      name: 'RSI (14) & Volume Accumulation',
      value: `RSI ${m.rsi14} · Vol ${m.volumeRatio}x avg`,
      status: rsiStatus,
      note:
        rsiStatus === 'pass'
          ? `Healthy momentum zone (48–${rsiUpper}) with steady buying volume.`
          : rsiOverbought
            ? 'RSI overbought trap zone — pullback ka wait karein.'
            : 'Volume ya RSI abhi neutral zone me hai.',
    });

    parameters.push({
      category: 'Fundamental',
      name: 'ROE / ROCE & Debt Check',
      value: roeValueText,
      status: roeStatus,
      note: roeNoteText,
    });

    const newsOk = news
      ? !news.hasNegativeRedFlag && news.negativeCount <= news.positiveCount
      : m.macdHist >= -0.5;
    const newsStatus: ParameterStatus = news
      ? news.hasNegativeRedFlag
        ? 'fail'
        : news.positiveCount > 0 && news.negativeCount === 0
          ? 'pass'
          : news.negativeCount > 0
            ? 'caution'
            : m.macdHist >= -0.5
              ? 'pass'
              : 'caution'
      : newsOk
        ? 'pass'
        : 'caution';
    const newsValText = news && news.items.length > 0
      ? `${news.sentimentLabel} (${news.positiveCount}+ / ${news.negativeCount}-) · ATR ${m.atrPct.toFixed(1)}%/d`
      : `Clean News · MACD Hist ${m.macdHist >= 0 ? '+' : ''}${m.macdHist} · ATR ${m.atrPct.toFixed(1)}%/d`;
    parameters.push({
      category: 'News',
      name: 'Live News Sentiment & Risk:Reward',
      value: newsValText,
      status: newsStatus,
      note:
        news?.hasNegativeRedFlag
          ? `Negative headline caution detect hui hai (${news.negativeCount} alert) — entry se pehle news verify karein.`
          : news && news.positiveCount > 0
            ? `${news.positiveCount} positive live catalyst headlines + chart support SL ke saath clean R:R.`
            : 'No adverse news red flags · per-stock chart support SL & resistance targets.',
    });
  } else if (section === 'long_term') {
    // Dedicated 8-check LONG TERM (> 1 Year) Fundamental Compounder & Valuation Audit
    const valuation = computeFundamentalFairValue(m, f ?? null, stock.sector);
    const distAbove200Pct =
      m.ema200 > 0 ? round2(((m.currentPrice - m.ema200) / m.ema200) * 100) : 0;

    // 1. Live Sales & Profit Compounding
    const ltGrowthStatus: ParameterStatus = hasLiveGrowth
      ? (earnG !== null && earnG >= 10) || (revG !== null && revG >= 10 && (earnG === null || earnG >= 0))
        ? 'pass'
        : (earnG !== null && earnG < -10) || (revG !== null && revG < -6)
          ? 'fail'
          : 'caution'
      : 'caution';
    parameters.push({
      category: 'Fundamental',
      name: 'Sales & Profit Compounding',
      value: growthValueText,
      status: ltGrowthStatus,
      note:
        ltGrowthStatus === 'pass'
          ? 'Long-term wealth compounding ke liye strong sales & profit growth.'
          : ltGrowthStatus === 'fail'
            ? 'Earnings contraction dikh raha hai — long-term conviction weak.'
            : 'Moderate growth — agle 1–2 quarter ke results track karein.',
    });

    // 2. ROE Capital Efficiency (>= 15%)
    const ltRoeStatus: ParameterStatus =
      roePct !== null
        ? roePct >= 15
          ? 'pass'
          : roePct < 9
            ? 'fail'
            : 'caution'
        : 'caution';
    parameters.push({
      category: 'Fundamental',
      name: 'ROE Capital Efficiency (>= 15%)',
      value: roePct !== null ? `ROE ${roePct.toFixed(1)}%` : stock.roeHint,
      status: ltRoeStatus,
      note:
        ltRoeStatus === 'pass'
          ? 'High return on equity — durable business compounding efficiency.'
          : ltRoeStatus === 'fail'
            ? 'ROE 9% se kam hai — capital efficiency weak.'
            : 'Average ROE — sector leader efficiency check karein.',
    });

    // 3. Balance Sheet & Profit Margin Quality
    const pm = f?.profitMarginPct ?? null;
    const bsStatus: ParameterStatus = isFin
      ? pm !== null
        ? pm >= 12
          ? 'pass'
          : pm < 5
            ? 'fail'
            : 'caution'
        : 'caution'
      : debtBad || (pm !== null && pm < 3)
        ? 'fail'
        : debtGood && (pm === null || pm >= 9)
          ? 'pass'
          : 'caution';
    parameters.push({
      category: 'Fundamental',
      name: 'Debt-to-Equity & Margin Health',
      value: [
        !isFin && dte !== null ? `D/E ${dte.toFixed(2)}x` : isFin ? 'Financial Sector' : '',
        pm !== null ? `Net Margin ${pm.toFixed(1)}%` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Verify balance sheet',
      status: bsStatus,
      note:
        bsStatus === 'pass'
          ? 'Clean balance sheet aur strong operating margin moat.'
          : bsStatus === 'fail'
            ? 'High debt ya patla profit margin — long-term risk high.'
            : 'Moderate debt/margin profile — cash flow check karein.',
    });

    // 4. Valuation Comfort (P/E vs Fair Value Upside)
    const valStatus: ParameterStatus =
      pe !== null
        ? (valuation.upsidePct >= 0 && pe <= 55) || (pe > 0 && pe <= 34 && valuation.upsidePct >= -5)
          ? 'pass'
          : (pe > 68 && valuation.upsidePct < -8) || valuation.upsidePct < -22
            ? 'fail'
            : 'caution'
        : valuation.upsidePct >= 5
          ? 'pass'
          : 'caution';
    parameters.push({
      category: 'Fundamental',
      name: 'Valuation Comfort (P/E & Fair Value)',
      value: `${pe !== null ? `P/E ${pe.toFixed(1)}x · ` : ''}FV ${fmtCurrency(valuation.fairValue, m.currency)} (${valuation.upsidePct >= 0 ? '+' : ''}${valuation.upsidePct}%)`,
      status: valStatus,
      note:
        valStatus === 'pass'
          ? `Reasonable long-term entry valuation (${valuation.basisLabel}).`
          : valStatus === 'fail'
            ? 'Expensive bubble valuation zone — deep pullback ya SIP wait karein.'
            : 'Fairly valued — staggered SIP accumulation better rahega.',
    });

    // 5. 50 & 200 DMA Structural Accumulation Zone (avoids chasing overextended >28% above 200 DMA)
    const accZoneGood = above200 && distAbove200Pct <= 24;
    const accOverextended = distAbove200Pct > 32;
    const ltEmaStatus: ParameterStatus = accZoneGood
      ? 'pass'
      : accOverextended || m.currentPrice < m.ema200 * 0.9
        ? 'fail'
        : 'caution';
    parameters.push({
      category: 'Price Action',
      name: '50 & 200 DMA Accumulation Zone',
      value: `200D ${fmtCurrency(m.ema200, m.currency)} (${distAbove200Pct >= 0 ? '+' : ''}${distAbove200Pct}%)`,
      status: ltEmaStatus,
      note:
        ltEmaStatus === 'pass'
          ? 'Long-term 200 DMA uptrend me healthy accumulation zone hai.'
          : accOverextended
            ? '200 DMA se bahut zyada stretched hai — dip par accumulate karein.'
            : '200 DMA ke aaspaas base confirmation ka wait karein.',
    });

    // 6. 1-Year Structural Compounding Trend
    const ret1YStatus: ParameterStatus =
      m.ret1Y >= 12 && above200 ? 'pass' : m.ret1Y < -15 ? 'fail' : 'caution';
    parameters.push({
      category: 'Technical',
      name: '1-Year Structural Trend',
      value: `1Y ${m.ret1Y >= 0 ? '+' : ''}${m.ret1Y}% · 3M ${m.ret3M >= 0 ? '+' : ''}${m.ret3M}%`,
      status: ret1YStatus,
      note:
        ret1YStatus === 'pass'
          ? 'Steady multi-quarter structural uptrend confirm hai.'
          : ret1YStatus === 'fail'
            ? '1-year downtrend me hai — falling knife avoid karein.'
            : 'Consolidating base — earnings trigger par breakout aa sakta hai.',
    });

    // 7. Governance & Live News Safety
    const ltNewsStatus: ParameterStatus = news
      ? news.hasNegativeRedFlag
        ? 'fail'
        : news.negativeCount === 0
          ? 'pass'
          : 'caution'
      : 'pass';
    parameters.push({
      category: 'News',
      name: 'Governance & Live News Safety',
      value:
        news && news.items.length > 0
          ? `${news.sentimentLabel} (${news.positiveCount}+ / ${news.negativeCount}-)`
          : 'Clean News · No Red Flags',
      status: ltNewsStatus,
      note: news?.hasNegativeRedFlag
        ? 'Adverse governance/news headline detect hui hai — long-term entry se pehle check karein.'
        : 'Clean news flow — koi governance red flag nahi.',
    });

    // 8. Institutional Liquidity & Long-Term Safety
    const ltLiqOk = m.avgTurnoverCr >= (isNifty1000 ? 8 : 20);
    parameters.push({
      category: 'Safety',
      name: `${universeLabel} & Thesis Safety`,
      value:
        market === 'NSE'
          ? `${isNifty1000 ? 'Nifty 1000' : 'Nifty 500'} · ₹${m.avgTurnoverCr.toFixed(0)} Cr/day`
          : `$${m.avgTurnoverCr.toFixed(0)}M/day`,
      status: ltLiqOk && !debtBad ? 'pass' : debtBad ? 'fail' : 'caution',
      note: ltLiqOk
        ? 'Strong institutional liquidity aur clear 200 DMA thesis-invalidation level.'
        : 'Moderate daily liquidity — staggered buying karein.',
    });
  } else if (section === 'mtf') {
    // Dedicated 8-check MTF (<= 14 Days) High-Liquidity Immediate Momentum Audit
    const mtfInfo = computeDynamicMtfLeverage(m, stock.mtf, f);
    const mtfRisk = buildSectionRiskLevels(m, 'mtf', universe);
    const distAbove20Pct =
      m.ema20 > 0 ? round2(((m.currentPrice - m.ema20) / m.ema20) * 100) : 0;
    const distFrom20High =
      m.high20 > 0 ? round2(((m.high20 - m.currentPrice) / m.high20) * 100) : 10;

    // 1. Group-1 MTF Liquidity & Dynamic Margin Tier
    parameters.push({
      category: 'Safety',
      name: 'Group-1 MTF Liquidity & Margin Tier',
      value: `${mtfInfo.label} · ₹${m.avgTurnoverCr.toFixed(0)} Cr/d`,
      status: mtfInfo.eligible && m.avgTurnoverCr >= 35 ? 'pass' : mtfInfo.eligible ? 'caution' : 'fail',
      note: mtfInfo.eligible
        ? `ATR ${m.atrPct.toFixed(1)}%/d ke hisab se ${mtfInfo.leverageNum}x safe MTF margin tier.`
        : 'MTF eligibility ya liquidity criteria pass nahi — Cash Only.',
    });

    // 2. 20 EMA Immediate Control (not chasing >7.5% above 20 EMA)
    const ema20Ok = above20 && distAbove20Pct <= 7.5;
    parameters.push({
      category: 'Technical',
      name: '20 EMA Immediate Control',
      value: `20E ${fmtCurrency(m.ema20, m.currency)} (${distAbove20Pct >= 0 ? '+' : ''}${distAbove20Pct}%)`,
      status: ema20Ok ? 'pass' : !above20 || distAbove20Pct > 11 ? 'fail' : 'caution',
      note: ema20Ok
        ? 'Price rising 20 EMA ke upar tight control me hai — tight SL possible.'
        : distAbove20Pct > 7.5
          ? '20 EMA se door bhaag chuka hai — MTF leverage me dip wait karein.'
          : '20 EMA ke neeche MTF long avoid karein.',
    });

    // 3. Immediate 1W Breakout Impulse (no dead/sideways stocks!)
    const impulsePass = m.ret1W >= 0.8 && distFrom20High <= 5.5;
    parameters.push({
      category: 'Price Action',
      name: 'Immediate 1W Breakout Impulse',
      value: `1W ${m.ret1W >= 0 ? '+' : ''}${m.ret1W}% · ${distFrom20High}% from 20D High`,
      status: impulsePass ? 'pass' : m.ret1W < -2.5 ? 'fail' : 'caution',
      note: impulsePass
        ? 'Immediate momentum active hai — sideways interest-burn trap nahi.'
        : 'Immediate breakout speed abhi slow hai — breakout candle wait karein.',
    });

    // 4. RSI (14) MTF Sweet Spot (52-70)
    const mtfRsiStatus: ParameterStatus =
      m.rsi14 >= 52 && m.rsi14 <= 70 ? 'pass' : m.rsi14 > 75 || m.rsi14 < 42 ? 'fail' : 'caution';
    parameters.push({
      category: 'Technical',
      name: 'RSI (14) MTF Sweet Spot',
      value: `RSI ${m.rsi14}`,
      status: mtfRsiStatus,
      note:
        mtfRsiStatus === 'pass'
          ? '52–70 fast momentum zone — overextended reversal risk kam.'
          : 'RSI overbought (>75) ya weak — leveraged trade me avoid karein.',
    });

    // 5. Volume Breakout Confirmation
    const mtfVolStatus: ParameterStatus =
      m.volumeRatio >= 1.15 ? 'pass' : m.volumeRatio >= 0.88 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: 'Volume Breakout Confirmation',
      value: `${m.volumeRatio}x of 20-day avg`,
      status: mtfVolStatus,
      note:
        mtfVolStatus === 'pass'
          ? 'Strong buying volume breakout ko back kar raha hai.'
          : 'Average volume — sharp move ke liye volume spike dekhein.',
    });

    // 6. MACD Positive Impulse
    const mtfMacdStatus: ParameterStatus =
      m.macdHist > 0 ? 'pass' : m.macd >= m.macdSignal * 0.99 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: 'MACD Bullish Impulse',
      value: `MACD ${m.macd} (Hist ${m.macdHist >= 0 ? '+' : ''}${m.macdHist})`,
      status: mtfMacdStatus,
      note: mtfMacdStatus === 'pass' ? 'Positive bullish MACD momentum active.' : 'MACD impulse abhi weak/flat hai.',
    });

    // 7. Zero Event / Negative News Gap Trap
    const mtfNewsStatus: ParameterStatus = news
      ? news.hasNegativeRedFlag || news.negativeCount > 0
        ? 'fail'
        : 'pass'
      : 'pass';
    parameters.push({
      category: 'News',
      name: 'Zero Negative News / Gap Trap',
      value:
        news && news.items.length > 0
          ? `${news.sentimentLabel} (${news.positiveCount}+ / ${news.negativeCount}-)`
          : 'Clean News · Low Gap Risk',
      status: mtfNewsStatus,
      note:
        mtfNewsStatus === 'fail'
          ? 'Negative news detect hui hai — leveraged MTF me gap-down risk high!'
          : 'No negative headlines — clean 5–14 day holding window.',
    });

    // 8. Upside vs 14-Day MTF Interest Cost Coverage
    const t1UpsidePct =
      m.currentPrice > 0 ? round2(((mtfRisk.target1 - m.currentPrice) / m.currentPrice) * 100) : 0;
    const fundedFraction = mtfInfo.leverageNum > 1 ? 1 - 1 / mtfInfo.leverageNum : 0;
    const est14dInterestPct = round2(fundedFraction * (14 / 365) * mtfRisk.expiryDays);
    const interestCovered = t1UpsidePct >= Math.max(3.5, est14dInterestPct * 8);
    parameters.push({
      category: 'Safety',
      name: 'Upside vs MTF Interest Cost',
      value: `T1 +${t1UpsidePct}% vs ~${est14dInterestPct}% (${mtfRisk.expiryDays}d int.)`,
      status: interestCovered ? 'pass' : t1UpsidePct >= 2.5 ? 'caution' : 'fail',
      note: interestCovered
        ? `Target 1 easily MTF interest (~${est14dInterestPct}%) se 8x+ zyada cover karta hai.`
        : 'Upside margin MTF interest ke muqable kam hai — cash trade better.',
    });
  } else {
    // Dedicated 8-check SWING TRADING (<= 1 Month) Fast Breakout / Pullback Audit
    const distAbove20Pct =
      m.ema20 > 0 ? round2(((m.currentPrice - m.ema20) / m.ema20) * 100) : 0;
    const distFrom20High =
      m.high20 > 0 ? round2(((m.high20 - m.currentPrice) / m.high20) * 100) : 10;

    // 1. 20 & 50 EMA Swing Alignment
    const swingEmaStatus: ParameterStatus =
      above20 && above50 && distAbove20Pct <= 10
        ? 'pass'
        : !above50 || distAbove20Pct > 14
          ? 'fail'
          : 'caution';
    parameters.push({
      category: 'Technical',
      name: '20 & 50 EMA Swing Uptrend',
      value: `20E ${fmtCurrency(m.ema20, m.currency)} · 50E ${fmtCurrency(m.ema50, m.currency)}`,
      status: swingEmaStatus,
      note:
        swingEmaStatus === 'pass'
          ? 'Price 20 & 50 EMA ke upar clean swing uptrend me hai.'
          : distAbove20Pct > 10
            ? '20 EMA se zyada extended hai — pullback entry wait karein.'
            : '50 EMA ke upar trend confirmation zaroori hai.',
    });

    // 2. RSI (14) Swing Sweet Spot (50-68)
    const swingRsiStatus: ParameterStatus =
      m.rsi14 >= 50 && m.rsi14 <= 68 ? 'pass' : m.rsi14 > 74 || m.rsi14 < 38 ? 'fail' : 'caution';
    parameters.push({
      category: 'Technical',
      name: 'RSI (14) Swing Momentum',
      value: `RSI ${m.rsi14}`,
      status: swingRsiStatus,
      note:
        swingRsiStatus === 'pass'
          ? 'Ideal 50–68 swing zone — fresh upside room available.'
          : 'RSI overbought (>74) ya weak zone — dip wait karein.',
    });

    // 3. MACD Bullish Momentum
    const swingMacdStatus: ParameterStatus =
      m.macdHist > 0 ? 'pass' : m.macd >= m.macdSignal * 0.98 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: 'MACD & Trend Strength',
      value: `MACD ${m.macd} (Hist ${m.macdHist >= 0 ? '+' : ''}${m.macdHist})`,
      status: swingMacdStatus,
      note: swingMacdStatus === 'pass' ? 'Bullish MACD histogram swing move ko support kar raha hai.' : 'MACD abhi flat/weak hai.',
    });

    // 4. Volume Accumulation Surge
    const swingVolStatus: ParameterStatus =
      m.volumeRatio >= 1.12 ? 'pass' : m.volumeRatio >= 0.85 ? 'caution' : 'fail';
    parameters.push({
      category: 'Technical',
      name: 'Volume Accumulation Surge',
      value: `${m.volumeRatio}x of 20-day avg`,
      status: swingVolStatus,
      note: swingVolStatus === 'pass' ? 'Buying volume 20-day average se upar hai.' : 'Normal volume activity.',
    });

    // 5. 20D Breakout / 20 EMA Pullback Structure
    const swingPaPass = (distFrom20High <= 6 || (distAbove20Pct >= 0 && distAbove20Pct <= 4.5)) && above20;
    const swingPaStatus: ParameterStatus = swingPaPass ? 'pass' : distFrom20High <= 12 ? 'caution' : 'fail';
    parameters.push({
      category: 'Price Action',
      name: '20D Breakout / Pullback Structure',
      value: `${distFrom20High}% from 20D High · ${distAbove20Pct >= 0 ? '+' : ''}${distAbove20Pct}% vs 20E`,
      status: swingPaStatus,
      note: swingPaPass
        ? 'Clean 20-day breakout ya 20 EMA support pullback setup.'
        : 'Mid-range consolidation — tight level ke paas entry dekhein.',
    });

    // 6. Swing Velocity & Daily ATR Fit (<= 1 Month Movers)
    const swingSpeedPass = m.atrPct >= 1.5 && m.atrPct <= 5.2 && m.avgWeeklyMovePct >= 3.0;
    const swingSpeedFail = m.atrPct < 1.1 || m.atrPct > 6.5;
    parameters.push({
      category: 'Price Action',
      name: 'Swing Speed & Volatility Fit',
      value: `ATR ${m.atrPct.toFixed(1)}%/d · Avg 1W ±${m.avgWeeklyMovePct.toFixed(1)}%`,
      status: swingSpeedPass ? 'pass' : swingSpeedFail ? 'fail' : 'caution',
      note: swingSpeedPass
        ? '1–4 week swing move ke liye healthy daily speed hai.'
        : m.atrPct < 1.1
          ? 'Stock bahut slow move karta hai — 1-month swing ke liye sluggish.'
          : 'High daily swings — position size chhota rakhein.',
    });

    // 7. Fundamental Trap Filter
    const swingFundStatus: ParameterStatus =
      roeStatus === 'fail' || growthStatus === 'fail'
        ? 'fail'
        : roeStatus === 'pass' || growthStatus === 'pass'
          ? 'pass'
          : 'caution';
    parameters.push({
      category: 'Fundamental',
      name: 'Quality Trap Filter (ROE · PAT)',
      value: `${roeValueText}${hasLiveGrowth ? ` · ${growthValueText}` : ''}`,
      status: swingFundStatus,
      note:
        swingFundStatus === 'fail'
          ? 'Weak fundamentals / earnings contraction — trap risk high.'
          : 'Profitable company — low fundamental trap risk.',
    });

    // 8. Live News Sentiment & Swing Liquidity
    const swingNewsStatus: ParameterStatus = news
      ? news.hasNegativeRedFlag
        ? 'fail'
        : news.negativeCount === 0 && m.avgTurnoverCr >= (isNifty1000 ? 5 : 15)
          ? 'pass'
          : 'caution'
      : m.avgTurnoverCr >= (isNifty1000 ? 5 : 15)
        ? 'pass'
        : 'caution';
    parameters.push({
      category: 'News',
      name: 'Live News & Liquidity Check',
      value:
        news && news.items.length > 0
          ? `${news.sentimentLabel} (${news.positiveCount}+ / ${news.negativeCount}-) · ₹${m.avgTurnoverCr.toFixed(0)} Cr/d`
          : `Clean News · ₹${m.avgTurnoverCr.toFixed(0)} Cr/d`,
      status: swingNewsStatus,
      note: news?.hasNegativeRedFlag
        ? 'Adverse news alert — swing entry se pehle news check karein.'
        : 'Clean news flow aur smooth entry/exit liquidity.',
    });
  }

  const passCount = parameters.filter((p) => p.status === 'pass').length;
  const failCount = parameters.filter((p) => p.status === 'fail').length;

  // Section-Specific Quantitative Composite Scoring (so Swing, Short Term, Long Term, and MTF each pick genuinely distinct best-fit stocks!)
  let rawScore = passCount * 1.2 - failCount * 1.5;

  if (section === 'long_term') {
    // LONG TERM (> 1Y): Fundamentally driven — ROE, PAT/Sales growth, Valuation/Fair Value upside, 200 DMA accumulation, 1Y compounding
    const val = computeFundamentalFairValue(m, f ?? null, stock.sector);
    const distAbove200 = m.ema200 > 0 ? ((m.currentPrice - m.ema200) / m.ema200) * 100 : 0;
    if (f) {
      rawScore += (fundScore - 6.2) * 1.15;
      if (val.upsidePct >= 10) rawScore += 1.4;
      else if (val.upsidePct >= 0) rawScore += 0.7;
      else if (val.upsidePct < -15) rawScore -= 1.5;
      if (pe !== null && pe > 0 && pe <= 35) rawScore += 0.9;
      else if (pe !== null && pe > 65) rawScore -= 1.4;
    }
    if (above200 && distAbove200 >= 0 && distAbove200 <= 22) rawScore += 1.1;
    if (distAbove200 > 32) rawScore -= 1.1; // Avoid chasing stretched parabolic spikes for 1Y+ entry
    if (m.ret1Y >= 12 && m.ret1Y <= 90) rawScore += 0.9;
    if (m.ret1Y < -10) rawScore -= 1.0;
    if (debtBad) rawScore -= 1.6;
  } else if (section === 'swing') {
    // SWING (<= 1M): Fast 20 EMA trend, 1W momentum, volume surge, healthy 1.5-4.5% daily ATR speed, non-overbought RSI
    const distAbove20 = m.ema20 > 0 ? ((m.currentPrice - m.ema20) / m.ema20) * 100 : 0;
    if (above20 && above50) rawScore += 1.1;
    if (distAbove20 >= 0 && distAbove20 <= 6) rawScore += 0.8;
    if (distAbove20 > 11) rawScore -= 1.0;
    if (m.rsi14 >= 52 && m.rsi14 <= 68) rawScore += 0.9;
    if (m.rsi14 > 74) rawScore -= 2.2;
    if (m.macdHist > 0) rawScore += 0.8;
    if (m.volumeRatio >= 1.2) rawScore += 0.9;
    if (m.ret1W >= 1.0 && m.ret1W <= 12) rawScore += 0.8;
    if (m.atrPct >= 1.6 && m.atrPct <= 4.5 && m.avgWeeklyMovePct >= 3.2) rawScore += 1.0;
    if (m.atrPct < 1.15) rawScore -= 1.1; // Penalize slow movers in Swing
    if (f) rawScore += (fundScore - 6.5) * 0.25;
  } else if (section === 'mtf') {
    // MTF (<= 14D): Group-1 high turnover, dynamic MTF eligibility, immediate 1W impulse + volume surge, ultra-clean news
    const mtfInfo = computeDynamicMtfLeverage(m, stock.mtf, f);
    if (!mtfInfo.eligible) rawScore -= 6.0;
    else rawScore += mtfInfo.leverageNum >= 3 ? 1.1 : 0.4;
    if (m.avgTurnoverCr >= 100) rawScore += 0.9;
    if (above20 && above50) rawScore += 1.0;
    if (m.ret1W >= 1.5 && m.ret1W <= 10) rawScore += 1.1;
    if (m.ret1W < 0) rawScore -= 0.9;
    if (m.volumeRatio >= 1.25) rawScore += 1.0;
    if (m.macdHist > 0) rawScore += 0.7;
    if (m.rsi14 >= 54 && m.rsi14 <= 69) rawScore += 0.8;
    if (m.rsi14 > 74) rawScore -= 2.4;
    if (news && (news.hasNegativeRedFlag || news.negativeCount > 0)) rawScore -= 2.4;
    if (f) rawScore += (fundScore - 6.5) * 0.2;
  } else {
    // SHORT TERM (< 3M): 50 & 200 EMA golden alignment, 3M RS vs Nifty 50, quarterly Sales & PAT growth, weekly base near 52W high
    if (goldenAlign) rawScore += 1.3;
    if (rs3M > 4) rawScore += 1.1;
    else if (rs3M > 1) rawScore += 0.5;
    if (distFrom52High <= 12 && above20) rawScore += 0.9;
    if (m.rsi14 >= 50 && m.rsi14 <= 70) rawScore += 0.8;
    if (m.rsi14 > 75) rawScore -= 2.2;
    if (m.macdHist > 0) rawScore += 0.5;
    if (f) rawScore += (fundScore - 6.5) * 0.5;
  }

  // Common live news catalyst reward / red-flag penalty
  if (news) {
    if (news.hasNegativeRedFlag) rawScore -= 1.8;
    else if (news.positiveCount >= 2 && news.negativeCount === 0) rawScore += 0.65;
    else if (news.positiveCount >= 1 && news.negativeCount === 0) rawScore += 0.35;
    else if (news.negativeCount > news.positiveCount) rawScore -= 0.7;
  }

  const techScore = round2(Math.max(4, Math.min(9.6, 5.5 + (above50 ? 1.5 : 0) + (above200 ? 1 : 0) + (m.macdHist > 0 ? 0.8 : 0) + (m.rsi14 >= 50 && m.rsi14 <= 70 ? 0.8 : -0.5))));
  const paScore = round2(Math.max(4, Math.min(9.5, 5.8 + (distFrom52High <= 12 ? 2 : distFrom52High <= 20 ? 1 : 0) + (above20 ? 1.2 : 0))));
  const rsNewsAdj = rs1M > 3 ? 0.3 : rs1M < -4 ? -0.3 : 0;
  const newsScore = news
    ? round2(Math.max(3.5, Math.min(9.4, news.sentimentScore + rsNewsAdj)))
    : round2(Math.max(5.0, Math.min(8.4, 6.8 + (rs1M > 2 ? 0.8 : rs1M < -3 ? -0.6 : 0))));
  const safetyScore = round2(
    Math.max(
      3.5,
      Math.min(
        9.5,
        6.8 +
          (m.avgTurnoverCr >= 25 ? 1.5 : 0.5) -
          (m.rsi14 > 75 ? 2.5 : 0) -
          (debtBad ? 1.2 : 0) -
          (news?.hasNegativeRedFlag ? 1.0 : 0)
      )
    )
  );

  // Weighted HD Rating aligned to this section's strategy DNA
  const weightedRating =
    section === 'long_term'
      ? fundScore * 0.42 + safetyScore * 0.2 + paScore * 0.16 + techScore * 0.12 + newsScore * 0.1
      : section === 'swing'
        ? techScore * 0.3 + paScore * 0.3 + newsScore * 0.15 + fundScore * 0.13 + safetyScore * 0.12
        : section === 'mtf'
          ? safetyScore * 0.28 + techScore * 0.28 + paScore * 0.24 + newsScore * 0.12 + fundScore * 0.08
          : techScore * 0.24 + paScore * 0.22 + fundScore * 0.24 + newsScore * 0.15 + safetyScore * 0.15;

  const hdRating = round2(Math.max(4.0, Math.min(9.5, weightedRating)));

  return {
    score: rawScore,
    passCount,
    hdRating,
    parameters,
    angleScores: {
      technical: techScore,
      priceAction: paScore,
      fundamentals: fundScore,
      news: newsScore,
      safety: safetyScore,
    },
  };
}

export async function scanUniverseLive(params: {
  section: TradingSection;
  market: SwingMarket;
  universe?: UniverseMode;
  count: number;
  language: ResearchLanguage;
  watchlist?: string;
}): Promise<{
  asOfDate: string;
  marketNote: string;
  setups: TradeSetup[];
  sources: GroundingSource[];
}> {
  const { section, market, count, language, watchlist } = params;
  const universe: UniverseMode = params.universe === 'nifty1000' ? 'nifty1000' : 'nifty500';
  const isNifty1000 = market === 'NSE' && universe === 'nifty1000';
  const universeBase =
    market === 'NSE'
      ? isNifty1000
        ? [...NIFTY_1000_HIGH_BETA_UNIVERSE, ...NIFTY_500_UNIVERSE]
        : NIFTY_500_UNIVERSE
      : US_LIQUID_UNIVERSE;

  // Allow user watchlist symbols to be prioritized first if provided
  const extraSymbols = (watchlist || '')
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length >= 2 && s.length <= 15);

  const candidates: UniverseStock[] = [];
  const seen = new Set<string>();
  for (const sym of extraSymbols) {
    if (seen.has(sym)) continue;
    seen.add(sym);
    const existing = universeBase.find((u) => u.symbol === sym);
    candidates.push(
      existing || {
        symbol: sym,
        name: sym,
        sector: 'Watchlist Pick',
        mtf: true,
        roeHint: 'Verify quarterly fundamentals',
        growthHint: 'User watchlist candidate',
      }
    );
  }
  for (const u of universeBase) {
    if (section === 'mtf' && !u.mtf) continue;
    if (!seen.has(u.symbol)) {
      seen.add(u.symbol);
      candidates.push(u);
    }
  }

  // Scan the FULL expanded candidate pool (all 64 Nifty 500 or all 112 Nifty 1000 stocks) via 16-way concurrency + 10m cache
  const maxPool = isNifty1000 ? candidates.length : Math.max(64, candidates.length);
  const batch = candidates.slice(0, maxPool);
  const benchSymbol = market === 'NSE' ? '^NSEI' : '^GSPC';

  const [benchMetrics, stockMetricsList] = await Promise.all([
    fetchChartMetrics(benchSymbol, market),
    mapWithConcurrency(batch, 16, (c) => fetchChartMetrics(c.symbol, market)),
  ]);

  const benchRet1M = benchMetrics?.ret1M ?? 0;
  const benchRet3M = benchMetrics?.ret3M ?? 0;
  const benchName = market === 'NSE' ? 'Nifty 50' : 'S&P 500';
  const marketRegime: 'Bullish' | 'Sideways' | 'Caution' = benchMetrics
    ? benchMetrics.currentPrice < benchMetrics.ema50 || benchRet1M <= -3.5
      ? 'Caution'
      : benchMetrics.currentPrice >= benchMetrics.ema20 && benchMetrics.currentPrice >= benchMetrics.ema50
        ? 'Bullish'
        : 'Sideways'
    : 'Sideways';
  const latestAsOfDate =
    benchMetrics?.asOfDate ||
    stockMetricsList.find((m) => m !== null)?.asOfDate ||
    new Date().toISOString().slice(0, 10);

  const scored: Array<{
    stock: UniverseStock;
    metrics: ChartMetrics;
    evalResult: ReturnType<typeof evaluateCandidate>;
  }> = [];

  for (let i = 0; i < batch.length; i++) {
    const metrics = stockMetricsList[i];
    if (!metrics || metrics.currentPrice <= 0) continue;
    const evalResult = evaluateCandidate(
      batch[i],
      metrics,
      benchRet1M,
      benchRet3M,
      section,
      market,
      universe
    );
    scored.push({ stock: batch[i], metrics, evalResult });
  }

  if (scored.length === 0) {
    throw new Error('Live exchange data fetch nahi ho paya. Internet check karke retry karein.');
  }

  // Stage 1: Technical pre-screen on entire scanned universe, then fetch REAL LIVE FUNDAMENTALS + LIVE GOOGLE NEWS for top 8 finalists
  scored.sort(
    (a, b) =>
      b.evalResult.passCount - a.evalResult.passCount ||
      b.evalResult.score - a.evalResult.score ||
      b.evalResult.hdRating - a.evalResult.hdRating
  );

  // For Long Term, pull top 16 finalists into live fundamental & valuation screening so quiet quality compounders are evaluated fairly
  const finalistLimit = section === 'long_term' ? 16 : 10;
  const finalists = scored.slice(0, Math.min(finalistLimit, scored.length));
  const [finalistFunds, finalistNews] = await Promise.all([
    mapWithConcurrency(finalists, 8, (item) => fetchLiveFundamentals(item.stock.symbol, market)),
    mapWithConcurrency(finalists, 8, (item) => fetchGoogleNews(item.stock.symbol, item.stock.name, market)),
  ]);

  const rescored = finalists.map((item, idx) => {
    const fund = finalistFunds[idx];
    const newsInfo = finalistNews[idx];
    const evalResult = evaluateCandidate(
      item.stock,
      item.metrics,
      benchRet1M,
      benchRet3M,
      section,
      market,
      universe,
      fund,
      newsInfo
    );
    return { ...item, fundamentals: fund, newsInfo, evalResult };
  });

  // Final sort strictly by real live parameter pass count (tech + live fundamentals + live news), composite score, and HD rating
  rescored.sort(
    (a, b) =>
      b.evalResult.passCount - a.evalResult.passCount ||
      b.evalResult.score - a.evalResult.score ||
      b.evalResult.hdRating - a.evalResult.hdRating
  );

  // Quality gate: tighten automatically in Caution/Bearish market regime (especially for MTF & Swing)
  const isStrictRegime = marketRegime === 'Caution' && (section === 'mtf' || section === 'swing');
  const minPassGate = isStrictRegime ? 7 : 6;
  const minRatingGate = isStrictRegime ? 7.4 : 7.0;
  const highQuality = rescored.filter(
    (item) => item.evalResult.passCount >= minPassGate && item.evalResult.hdRating >= minRatingGate
  );
  const fallbackCap = isStrictRegime ? Math.min(count, 1) : Math.min(count, 2);
  const picked = (highQuality.length > 0 ? highQuality : rescored.slice(0, fallbackCap)).slice(
    0,
    count
  );

  const now = new Date();
  const callDateLabel = now
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    .toUpperCase();

  const universeDisplay =
    market === 'NSE' ? (isNifty1000 ? 'Nifty 1000 (High Risk)' : 'Nifty 500 (Low Risk)') : 'US Liquid';

  const allSources: GroundingSource[] = [];
  const setups: TradeSetup[] = picked.map((item, idx) => {
    const { stock, metrics: m, evalResult, fundamentals: fund, newsInfo } = item;
    const risk = buildSectionRiskLevels(m, section, universe);
    const mtfInfo = computeDynamicMtfLeverage(m, stock.mtf, fund);
    const callExpiryDate = new Date(now.getTime() + risk.expiryDays * 24 * 60 * 60 * 1000)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        ...(section === 'long_term' ? { year: 'numeric' as const } : {}),
      })
      .toUpperCase();

    const paramsCopy = [...evalResult.parameters];

    const latestHeadline = newsInfo.items[0]?.title || 'No negative news red flags detected.';
    const setupSources: GroundingSource[] = [
      {
        index: 1,
        title: `${stock.symbol} Live NSE/Market Chart`,
        uri: m.chartUrl,
        domain: 'finance.yahoo.com',
      },
      ...newsInfo.sources.slice(0, 2).map((s, sIdx) => ({ ...s, index: sIdx + 2 })),
    ];
    allSources.push(...setupSources);

    const isEn = language === 'en';
    const entryRule = isEn
      ? `Accumulate in ${fmtCurrency(risk.entryMin, m.currency)}–${fmtCurrency(risk.entryMax, m.currency)} zone while holding above 20 EMA (${fmtCurrency(m.ema20, m.currency)}) with steady volume.`
      : `${fmtCurrency(risk.entryMin, m.currency)} se ${fmtCurrency(risk.entryMax, m.currency)} ke beech entry lein jab price 20 EMA (${fmtCurrency(m.ema20, m.currency)}) ke upar hold kare aur volume stable rahe.`;

    const exitRule = isEn
      ? `Strict Stoploss at ${fmtCurrency(risk.stopLoss, m.currency)} on daily close. Book 50% at Target 1 (${fmtCurrency(risk.target1, m.currency)}) and trail SL to cost for Target 2 (${fmtCurrency(risk.target2, m.currency)}).`
      : `Strict Stoploss ${fmtCurrency(risk.stopLoss, m.currency)} (daily closing basis). Target 1 (${fmtCurrency(risk.target1, m.currency)}) par 50% profit book karein aur SL cost par trail karke Target 2 (${fmtCurrency(risk.target2, m.currency)}) tak hold karein.`;

    const rationale = isEn
      ? `${stock.name} (${universeDisplay}) passed ${evalResult.passCount}/8 parameters: trading above 50 EMA (${fmtCurrency(m.ema50, m.currency)}) & 200 EMA (${fmtCurrency(m.ema200, m.currency)}) with RSI ${m.rsi14} and 3M return ${m.ret3M >= 0 ? '+' : ''}${m.ret3M}%.`
      : `${stock.name} (${universeDisplay}) ne ${evalResult.passCount}/8 parameters pass kiye hain — 50 EMA (${fmtCurrency(m.ema50, m.currency)}) aur 200 EMA (${fmtCurrency(m.ema200, m.currency)}) structure strong hai, RSI ${m.rsi14} healthy zone me hai aur 3M return ${m.ret3M >= 0 ? '+' : ''}${m.ret3M}% hai.`;

    const trapWarning =
      m.rsi14 > 70
        ? isEn
          ? `RSI is elevated (${m.rsi14}) — avoid chasing sharp gap-ups; enter only on dips near ${fmtCurrency(risk.entryMin, m.currency)}.`
          : `RSI thoda high (${m.rsi14}) hai — tez gap-up me chase mat karein, dip par ${fmtCurrency(risk.entryMin, m.currency)} ke paas hi entry lein.`
        : newsInfo.hasNegativeRedFlag
          ? `Latest news headline check zaroori hai: "${latestHeadline}".`
          : isEn
            ? `Respect Stoploss ${fmtCurrency(risk.stopLoss, m.currency)} strictly if daily close breaks below support.`
            : `Agar daily close ${fmtCurrency(risk.stopLoss, m.currency)} ke neeche jaye to turant exit karein taaki capital safe rahe.`;

    return {
      id: `${section}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      section,
      universe: market === 'NSE' ? universe : undefined,
      symbol: stock.symbol,
      companyName: m.companyName || stock.name,
      exchange: m.exchange,
      sector: stock.sector,
      currency: m.currency,
      direction: 'Long',
      currentPrice: m.currentPrice,
      prevClose: m.prevClose,
      dayChangePct: m.dayChangePct,
      asOfDate: m.asOfDate,
      callDate: callDateLabel,
      callExpiryDate,
      hdRating: evalResult.hdRating,
      angleScores: evalResult.angleScores,
      parameters: paramsCopy,
      entryMin: risk.entryMin,
      entryMax: risk.entryMax,
      stopLoss: risk.stopLoss,
      target1: risk.target1,
      target2: risk.target2,
      riskReward: risk.riskReward,
      holdingWindow: risk.holdingWindow,
      expiryDays: risk.expiryDays,
      slLogic: risk.slLogic,
      targetLogic: risk.targetLogic,
      expiryLogic: risk.expiryLogic,
      setupType:
        section === 'short_term' && market === 'NSE'
          ? isNifty1000
            ? 'Nifty 1000 High-Risk Momentum'
            : 'Nifty 500 Low-Risk Positional'
          : section === 'mtf'
            ? isNifty1000
              ? 'Nifty 1000 High-Beta MTF'
              : 'MTF High-Liquidity Momentum'
            : section === 'long_term'
              ? isNifty1000
                ? 'Nifty 1000 Emerging Compounder'
                : 'Long-Term Quality Compounder'
              : isNifty1000
                ? 'Nifty 1000 High-Beta Swing'
                : 'Swing Breakout / Pullback',
      entryRule,
      exitRule,
      rationale,
      strengths: [
        fund && fund.roePct !== null
          ? `${evalResult.passCount}/8 Live Checks Passed · ROE ${fund.roePct.toFixed(1)}%${fund.earningsGrowthPct !== null ? `, PAT ${fund.earningsGrowthPct >= 0 ? '+' : ''}${fund.earningsGrowthPct.toFixed(1)}%` : ''}`
          : `${evalResult.passCount}/8 Live Checks Passed (${stock.roeHint})`,
        `3M Return ${m.ret3M >= 0 ? '+' : ''}${m.ret3M}% vs Benchmark ${benchRet3M >= 0 ? '+' : ''}${benchRet3M}%`,
      ],
      weaknesses: [
        fund && fund.trailingPe !== null && fund.trailingPe > 45
          ? `High Valuation P/E ${fund.trailingPe.toFixed(1)} — position size disciplined rakhein`
          : m.rsi14 > 68
            ? `Short-term RSI ${m.rsi14} near upper band`
            : `Daily volatility ATR ${m.atrPct.toFixed(1)}% — respect SL strictly`,
        `Strict SL ${fmtCurrency(risk.stopLoss, m.currency)} (${risk.slLogic})`,
      ],
      trapWarning,
      newsSummary: latestHeadline,
      mtfLeverage: section === 'mtf' ? mtfInfo.label : '',
      status: 'watching',
      sources: setupSources,
      createdAt: now.toISOString(),
    };
  });

  const regimeNoteEn =
    marketRegime === 'Caution'
      ? `Market Regime: CAUTION (${benchName} below 50 EMA / weak 1M — tightened filter, use half size). `
      : marketRegime === 'Bullish'
        ? `Market Regime: BULLISH (${benchName} above 20 & 50 EMA). `
        : `Market Regime: SIDEWAYS (${benchName} consolidating). `;
  const regimeNoteHi =
    marketRegime === 'Caution'
      ? `Market Regime: CAUTION (${benchName} 50 EMA ke neeche / weak — strict filter active, half size rakhein). `
      : marketRegime === 'Bullish'
        ? `Market Regime: BULLISH (${benchName} 20 & 50 EMA ke upar strong). `
        : `Market Regime: SIDEWAYS (${benchName} range-bound). `;

  const marketNote =
    language === 'en'
      ? `${regimeNoteEn}Screened ${scored.length} ${universeDisplay} stocks on live ${latestAsOfDate} data (${benchName} 1M: ${benchRet1M >= 0 ? '+' : ''}${benchRet1M}%, 3M: ${benchRet3M >= 0 ? '+' : ''}${benchRet3M}%). Top ${setups.length} setups selected.`
      : `${regimeNoteHi}Live ${latestAsOfDate} data par ${scored.length} ${universeDisplay} stocks scan kiye gaye (${benchName} 1M: ${benchRet1M >= 0 ? '+' : ''}${benchRet1M}%, 3M: ${benchRet3M >= 0 ? '+' : ''}${benchRet3M}%). Top ${setups.length} highest-passing setups select kiye gaye hain.`;

  return {
    asOfDate: latestAsOfDate,
    marketNote,
    setups,
    sources: allSources.slice(0, 8),
  };
}

function calcExpiryDaysLeft(
  createdAt?: string,
  expiryDays?: number,
  callExpiryDate?: string
): number | null {
  let expiryMs: number | null = null;
  if (createdAt && expiryDays && expiryDays > 0) {
    const createdMs = Date.parse(createdAt);
    if (!Number.isNaN(createdMs)) {
      expiryMs = createdMs + expiryDays * 24 * 60 * 60 * 1000;
    }
  }
  if (expiryMs === null && callExpiryDate) {
    const hasYear = /\b20\d{2}\b/.test(callExpiryDate);
    const parsed = Date.parse(
      hasYear ? callExpiryDate : `${callExpiryDate} ${new Date().getFullYear()}`
    );
    if (!Number.isNaN(parsed)) {
      expiryMs = parsed;
    }
  }
  if (expiryMs === null) return null;
  return Math.ceil((expiryMs - Date.now()) / (24 * 60 * 60 * 1000));
}

export async function recheckSetupsLive(
  setups: Array<{
    id: string;
    symbol: string;
    exchange?: string;
    currency?: '₹' | '$';
    direction?: 'Long' | 'Short';
    entryMin: number;
    entryMax: number;
    stopLoss: number;
    target1: number;
    target2: number;
    actualEntry?: string;
    status?: string;
    callExpiryDate?: string;
    expiryDays?: number;
    createdAt?: string;
  }>,
  language: ResearchLanguage
): Promise<Array<LiveRecheckUpdate & { id: string }>> {
  const checkedAt = new Date().toISOString();
  const isEn = language === 'en';

  const results = await Promise.all(
    setups.map(async (s) => {
      const market: SwingMarket = s.currency === '$' || s.exchange === 'US' ? 'US' : 'NSE';
      // Always bypass chart cache on Exit Check so user gets freshest live price
      const [m, news] = await Promise.all([
        fetchChartMetrics(s.symbol, market, true),
        fetchGoogleNews(s.symbol, s.symbol, market),
      ]);

      if (!m) {
        return {
          id: s.id,
          latestPrice: s.entryMax,
          prevClose: s.entryMax,
          actionSignal: 'HOLD' as LiveExitSignal,
          exitReason: isEn
            ? 'Live quote temporarily unavailable — keep your broker Stoploss active.'
            : 'Live price abhi fetch nahi hua — broker par apna Stoploss active rakhein.',
          newsAlert: '',
          checkedAt,
        };
      }

      const p = m.currentPrice;
      const entryRef = Number(s.actualEntry) || (s.entryMin + s.entryMax) / 2 || s.entryMin;
      const isShort =
        s.direction === 'Short' || (s.stopLoss > s.entryMax && s.target1 < s.entryMin);
      const gainPct =
        entryRef > 0
          ? round2(((isShort ? entryRef - p : p - entryRef) / entryRef) * 100)
          : 0;

      const daysLeft = calcExpiryDaysLeft(s.createdAt, s.expiryDays, s.callExpiryDate);
      const isExpired = daysLeft !== null && daysLeft < 0;
      const expirySuffix = isExpired
        ? isEn
          ? ' ⏱ Call expiry window ended — review exit/rollover.'
          : ' ⏱ Call expiry date nikal chuki hai — position review/exit karein.'
        : daysLeft !== null && daysLeft <= 2
          ? isEn
            ? ` ⏱ Call expires in ${daysLeft}d.`
            : ` ⏱ Call expiry me sirf ${daysLeft}d bache hain.`
          : '';

      const redFlagSuffix = news.hasNegativeRedFlag
        ? isEn
          ? ' ⚠️ Negative news headline detected — verify news and keep SL strict.'
          : ' ⚠️ Negative news alert detect hua hai — news check karke tight SL rakhein.'
        : '';

      let actionSignal: LiveExitSignal = 'HOLD';
      let suggestedTrailingSl: number | undefined;
      let exitReason = '';

      if (isShort) {
        // Mirror logic for SHORT trades (SL above entry, Target 1 & Target 2 below entry)
        const t1Dist = Math.max(0, entryRef - s.target1);
        const trailStep = Math.min(
          Math.max(m.atr14 * 1.5, entryRef * 0.025),
          t1Dist > 0 ? Math.max(entryRef * 0.025, t1Dist * 0.45) : Infinity
        );
        const shortTrailTrigger = entryRef - trailStep;
        const atrShortTrail = round2(p + m.atr14 * 1.35);
        const emaShortTrail = round2(m.ema20 * 1.008);
        const dynamicShortTrail = round2(
          Math.min(s.stopLoss, Math.max(Math.min(entryRef * 0.998, emaShortTrail), atrShortTrail))
        );
        const shortChaseLimit = s.entryMin - Math.max(m.atr14 * 0.85, s.entryMin * 0.015);

        if (p >= s.stopLoss) {
          actionSignal = 'EXIT_NOW';
          exitReason = isEn
            ? `Price (${fmtCurrency(p, m.currency)}) crossed above Short Stoploss (${fmtCurrency(s.stopLoss, m.currency)}). Cover short immediately.${redFlagSuffix}`
            : `Price (${fmtCurrency(p, m.currency)}) Short Stoploss (${fmtCurrency(s.stopLoss, m.currency)}) ke upar chala gaya hai — turant cover/exit karein.${redFlagSuffix}`;
        } else if (s.target2 > 0 && p <= s.target2) {
          actionSignal = 'BOOK_PARTIAL';
          suggestedTrailingSl = round2(Math.min(s.target1 * 1.01, p + m.atr14 * 1.15));
          exitReason = isEn
            ? `Short Target 2 (${fmtCurrency(s.target2, m.currency)}) hit at ${fmtCurrency(p, m.currency)} (+${gainPct}%)! Book major profits or trail SL down to ${fmtCurrency(suggestedTrailingSl, m.currency)}.`
            : `Short Target 2 (${fmtCurrency(s.target2, m.currency)}) achieve ho gaya (${fmtCurrency(p, m.currency)}, +${gainPct}%)! Major profit book karein ya SL ${fmtCurrency(suggestedTrailingSl, m.currency)} par trail karein.`;
        } else if (p <= s.target1) {
          actionSignal = 'BOOK_PARTIAL';
          suggestedTrailingSl = round2(Math.min(s.stopLoss, entryRef, p + m.atr14 * 1.4));
          exitReason = isEn
            ? `Short Target 1 (${fmtCurrency(s.target1, m.currency)}) hit at ${fmtCurrency(p, m.currency)} (+${gainPct}%). Book 50% and trail SL down to ${fmtCurrency(suggestedTrailingSl, m.currency)}.`
            : `Short Target 1 (${fmtCurrency(s.target1, m.currency)}) hit ho gaya (${fmtCurrency(p, m.currency)}, +${gainPct}%)! 50% book karein aur SL neeche ${fmtCurrency(suggestedTrailingSl, m.currency)} par trail karein.`;
        } else if (p <= shortTrailTrigger && dynamicShortTrail < s.stopLoss * 0.995) {
          actionSignal = 'TRAIL_SL';
          suggestedTrailingSl = dynamicShortTrail;
          exitReason = isEn
            ? `Short trade up +${gainPct}%. Lower SL to ${fmtCurrency(suggestedTrailingSl, m.currency)} (20 EMA / 1.35×ATR) to lock gains.${expirySuffix}`
            : `Short trade +${gainPct}% profit me hai. SL ko neeche ${fmtCurrency(suggestedTrailingSl, m.currency)} (20 EMA / 1.35×ATR) par trail karein.${expirySuffix}`;
        } else if (s.status === 'watching' && isExpired) {
          actionSignal = 'WAIT_ENTRY';
          exitReason = isEn
            ? `Short call expired (${s.callExpiryDate || 'window ended'}) — avoid fresh entry.`
            : `Short call ki expiry nikal chuki hai — fresh entry avoid karein.`;
        } else if (s.status === 'watching' && p < shortChaseLimit) {
          actionSignal = 'WAIT_ENTRY';
          exitReason = isEn
            ? `Price (${fmtCurrency(p, m.currency)}) already dropped >0.85×ATR below short entry zone. Avoid chasing.`
            : `Price (${fmtCurrency(p, m.currency)}) short entry zone se kaafi neeche ja chuka hai — chase mat karein, bounce ka wait karein.`;
        } else {
          actionSignal = 'HOLD';
          exitReason = isEn
            ? `Short setup active at ${fmtCurrency(p, m.currency)} (${gainPct >= 0 ? '+' : ''}${gainPct}%, RSI ${m.rsi14}). Hold with SL at ${fmtCurrency(s.stopLoss, m.currency)}.${expirySuffix}`
            : `Short setup ${fmtCurrency(p, m.currency)} (${gainPct >= 0 ? '+' : ''}${gainPct}%, RSI ${m.rsi14}) par active hai. SL ${fmtCurrency(s.stopLoss, m.currency)} ke saath hold rakhein.${expirySuffix}`;
        }
      } else {
        // LONG trade logic + Call Expiry + Early Breakdown Warning
        const t1Dist = Math.max(0, s.target1 - entryRef);
        const trailTriggerByAtr = entryRef + Math.max(m.atr14 * 1.5, entryRef * 0.025);
        const trailTriggerByT1 = t1Dist > 0 ? entryRef + t1Dist * 0.45 : Infinity;
        const trailTriggerPrice = Math.min(
          trailTriggerByAtr,
          Math.max(entryRef * 1.025, trailTriggerByT1)
        );
        const atrTrailSl = round2(p - m.atr14 * 1.35);
        const emaTrailSl = round2(m.ema20 * 0.992);
        const dynamicTrailCandidate = round2(
          Math.max(s.stopLoss, Math.min(Math.max(entryRef * 1.002, emaTrailSl), atrTrailSl))
        );
        const chaseLimit = s.entryMax + Math.max(m.atr14 * 0.85, s.entryMax * 0.015);
        const heavyBreakdown =
          s.status === 'entered' &&
          p < m.ema20 &&
          p < m.ema50 &&
          m.volumeRatio >= 1.3 &&
          gainPct <= -2.0;

        if (p <= s.stopLoss) {
          actionSignal = 'EXIT_NOW';
          exitReason = isEn
            ? `Price (${fmtCurrency(p, m.currency)}) has breached Stoploss (${fmtCurrency(s.stopLoss, m.currency)}). Exit to protect capital.${redFlagSuffix}`
            : `Price (${fmtCurrency(p, m.currency)}) Stoploss (${fmtCurrency(s.stopLoss, m.currency)}) ke neeche aa gaya hai — capital bachane ke liye turant exit karein.${redFlagSuffix}`;
        } else if (s.target2 > 0 && p >= s.target2) {
          actionSignal = 'BOOK_PARTIAL';
          suggestedTrailingSl = round2(Math.max(s.target1 * 0.99, p - m.atr14 * 1.15));
          exitReason = isEn
            ? `Target 2 (${fmtCurrency(s.target2, m.currency)}) achieved at ${fmtCurrency(p, m.currency)} (+${gainPct}%)! Book major profits or trail tight SL at ${fmtCurrency(suggestedTrailingSl, m.currency)} (1.15×ATR).`
            : `Target 2 (${fmtCurrency(s.target2, m.currency)}) achieve ho gaya (${fmtCurrency(p, m.currency)}, +${gainPct}%)! Major profit book karein ya tight SL ${fmtCurrency(suggestedTrailingSl, m.currency)} (1.15×ATR) par trail karein.`;
        } else if (p >= s.target1) {
          actionSignal = 'BOOK_PARTIAL';
          suggestedTrailingSl = round2(Math.max(s.stopLoss, entryRef, p - m.atr14 * 1.4));
          exitReason = isEn
            ? `Target 1 (${fmtCurrency(s.target1, m.currency)}) achieved at ${fmtCurrency(p, m.currency)} (+${gainPct}%). Book 50% profit and trail SL to ${fmtCurrency(suggestedTrailingSl, m.currency)}.${redFlagSuffix}`
            : `Target 1 (${fmtCurrency(s.target1, m.currency)}) achieve ho gaya (${fmtCurrency(p, m.currency)}, +${gainPct}%)! 50% profit book karein aur SL ko ${fmtCurrency(suggestedTrailingSl, m.currency)} par trail kar lein.${redFlagSuffix}`;
        } else if (p >= trailTriggerPrice && dynamicTrailCandidate > s.stopLoss * 1.005) {
          actionSignal = 'TRAIL_SL';
          suggestedTrailingSl = dynamicTrailCandidate;
          exitReason = isEn
            ? `Up +${gainPct}% (above ${m.atrPct.toFixed(1)}% daily ATR trail trigger). Raise SL to ${fmtCurrency(suggestedTrailingSl, m.currency)} (20 EMA / 1.35×ATR support) to protect gains.${redFlagSuffix}${expirySuffix}`
            : `Stock +${gainPct}% profit me hai (ATR ${m.atrPct.toFixed(1)}%/d trail trigger cross). SL ko upar ${fmtCurrency(suggestedTrailingSl, m.currency)} (20 EMA / 1.35×ATR support) par shift karein.${redFlagSuffix}${expirySuffix}`;
        } else if (heavyBreakdown) {
          actionSignal = 'EXIT_NOW';
          exitReason = isEn
            ? `Early breakdown alert: price (${fmtCurrency(p, m.currency)}, ${gainPct}%) slipped below both 20 & 50 EMA on ${m.volumeRatio}x volume. Tighten SL or exit before ${fmtCurrency(s.stopLoss, m.currency)}.${redFlagSuffix}`
            : `Early breakdown warning: price (${fmtCurrency(p, m.currency)}, ${gainPct}%) ${m.volumeRatio}x heavy volume par 20 aur 50 EMA dono ke neeche aa gaya hai — SL ${fmtCurrency(s.stopLoss, m.currency)} se pehle exit/cut risk review karein.${redFlagSuffix}`;
        } else if (s.status === 'watching' && isExpired) {
          actionSignal = 'WAIT_ENTRY';
          exitReason = isEn
            ? `Call expired (${s.callExpiryDate || 'window ended'}) — avoid fresh entry and scan fresh setups.`
            : `Is call ki expiry nikal chuki hai — fresh entry avoid karein aur naya scan chalayein.`;
        } else if (s.status === 'watching' && p > chaseLimit) {
          actionSignal = 'WAIT_ENTRY';
          exitReason = isEn
            ? `Price (${fmtCurrency(p, m.currency)}) is >0.85×ATR above entry zone (${fmtCurrency(s.entryMax, m.currency)}). Avoid chasing; wait for pullback.`
            : `Price (${fmtCurrency(p, m.currency)}) entry zone (${fmtCurrency(s.entryMax, m.currency)}) se 0.85×ATR upar nikal gaya hai — chase mat karein, dip ka wait karein.`;
        } else {
          actionSignal = 'HOLD';
          exitReason = isEn
            ? `Trend intact at ${fmtCurrency(p, m.currency)} (${gainPct >= 0 ? '+' : ''}${gainPct}%, RSI ${m.rsi14}, 20 EMA ${fmtCurrency(m.ema20, m.currency)}). Hold with SL at ${fmtCurrency(s.stopLoss, m.currency)}.${redFlagSuffix}${expirySuffix}`
            : `Price ${fmtCurrency(p, m.currency)} (${gainPct >= 0 ? '+' : ''}${gainPct}%) par trend intact hai (RSI ${m.rsi14}, 20 EMA ${fmtCurrency(m.ema20, m.currency)}). SL ${fmtCurrency(s.stopLoss, m.currency)} ke saath hold rakhein.${redFlagSuffix}${expirySuffix}`;
        }
      }

      return {
        id: s.id,
        latestPrice: p,
        prevClose: m.prevClose,
        actionSignal,
        suggestedTrailingSl,
        exitReason,
        newsAlert: news.items[0]?.title || '',
        checkedAt,
      };
    })
  );

  return results;
}

export async function buildDeepResearchLive(
  query: string,
  market: SwingMarket,
  language: ResearchLanguage
): Promise<StockDeepReport> {
  const resolved = await resolveSymbolQuery(query, market);
  if (!resolved) {
    throw new Error('Stock symbol samajh nahi aaya. Sahi NSE/US symbol likhein (e.g. TATASTEEL, TRENT, BEL).');
  }

  const benchSymbol = resolved.market === 'NSE' ? '^NSEI' : '^GSPC';
  const [m, bench, news, fund] = await Promise.all([
    fetchChartMetrics(resolved.symbol, resolved.market),
    fetchChartMetrics(benchSymbol, resolved.market),
    fetchGoogleNews(resolved.symbol, resolved.companyName, resolved.market),
    fetchLiveFundamentals(resolved.symbol, resolved.market),
  ]);

  if (!m) {
    throw new Error(`"${resolved.symbol}" ka live market data nahi mil paya. Symbol verify karke retry karein.`);
  }

  const catalogHit =
    NIFTY_500_UNIVERSE.find((u) => u.symbol === resolved.symbol) ||
    NIFTY_1000_HIGH_BETA_UNIVERSE.find((u) => u.symbol === resolved.symbol) ||
    US_LIQUID_UNIVERSE.find((u) => u.symbol === resolved.symbol);

  const stockInfo: UniverseStock = catalogHit || {
    symbol: resolved.symbol,
    name: m.companyName || resolved.companyName,
    sector: resolved.sector,
    mtf: m.avgTurnoverCr >= 25,
    roeHint: 'Verify latest quarterly ROE/ROCE',
    growthHint: 'Check latest quarterly results',
  };

  const mtfInfo = computeDynamicMtfLeverage(m, stockInfo.mtf, fund);
  const valuation = computeFundamentalFairValue(m, fund, stockInfo.sector);
  const isFin = isFinancialSector(stockInfo.sector);
  const roePct = fund?.roePct ?? null;
  const dte = fund?.debtToEquityRatio ?? null;
  const debtBad = !isFin && dte !== null && dte > 1.5;
  const above20 = m.currentPrice >= m.ema20;
  const above50 = m.currentPrice >= m.ema50;
  const above200 = m.currentPrice >= m.ema200;

  // Step 1: Determine stock's natural best-fit section using BOTH live fundamentals + trend/speed
  const ltFundHealthy =
    !debtBad &&
    (roePct === null || roePct >= 13) &&
    valuation.upsidePct >= -8 &&
    (m.ret1Y >= 8 || (fund?.earningsGrowthPct ?? 0) >= 8);

  let bestFitSection: TradingSection | 'avoid' =
    (!above50 && !above200) || m.rsi14 > 78 || news.hasNegativeRedFlag || (debtBad && roePct !== null && roePct < 7)
      ? 'avoid'
      : mtfInfo.eligible &&
          above20 &&
          above50 &&
          m.volumeRatio >= 1.25 &&
          m.ret1W >= 1.0 &&
          m.rsi14 >= 50 &&
          m.rsi14 <= 70
        ? 'mtf'
        : above20 &&
            above50 &&
            m.atrPct >= 1.5 &&
            m.avgWeeklyMovePct >= 3.2 &&
            m.macdHist > 0 &&
            m.rsi14 >= 48 &&
            m.rsi14 <= 72
          ? 'swing'
          : above200 && ltFundHealthy
            ? 'long_term'
            : above50 && above200 && m.ret3M >= 2
              ? 'short_term'
              : above50
                ? 'short_term'
                : 'avoid';

  // Step 2: Score stock using the exact 8-parameter blueprint of its best-fit strategy!
  const evalSection: TradingSection = bestFitSection === 'avoid' ? 'short_term' : bestFitSection;
  const evalRes = evaluateCandidate(
    stockInfo,
    m,
    bench?.ret1M ?? 0,
    bench?.ret3M ?? 0,
    evalSection,
    resolved.market,
    'nifty500',
    fund,
    news
  );

  // If strategy-matched HD Rating is weak (< 5.8), downgrade recommendation to Avoid so verdict & bestFit never contradict
  if (evalRes.hdRating < 5.8) {
    bestFitSection = 'avoid';
  }

  const risk = buildSectionRiskLevels(
    m,
    bestFitSection === 'avoid' ? 'short_term' : bestFitSection
  );
  const sectionPlans = {
    swing: buildSectionRiskLevels(m, 'swing'),
    short_term: buildSectionRiskLevels(m, 'short_term'),
    long_term: buildSectionRiskLevels(m, 'long_term'),
    mtf: buildSectionRiskLevels(m, 'mtf'),
  };

  const maBullCount =
    (above20 ? 1 : 0) +
    (above50 ? 1 : 0) +
    (above200 ? 1 : 0);
  const maSignal =
    maBullCount === 3 ? 'Strong Buy' : maBullCount === 2 ? 'Buy' : maBullCount === 1 ? 'Neutral' : 'Sell';
  const indSignal =
    m.macdHist > 0 && m.rsi14 >= 50 && m.rsi14 <= 70
      ? 'Buy'
      : m.macdHist < 0 && m.rsi14 < 45
        ? 'Sell'
        : 'Neutral';
  const overallSignal =
    maBullCount === 3 && indSignal === 'Buy'
      ? 'Strong Buy'
      : maBullCount >= 2 && indSignal !== 'Sell'
        ? 'Buy'
        : maBullCount === 0
          ? 'Sell'
          : 'Neutral';

  const fairValue = valuation.fairValue;
  const fairValueUpsidePct = valuation.upsidePct;
  const isEn = language === 'en';

  const keyIndicators = [
    ...(fund?.marketCapCr !== null && fund?.marketCapCr !== undefined
      ? [
          {
            label: 'Market Cap',
            value:
              m.currency === '₹'
                ? `₹${Math.round(fund.marketCapCr).toLocaleString('en-IN')} Cr`
                : `$${(fund.marketCapCr / 1000).toFixed(1)}B`,
          },
        ]
      : []),
    ...(fund?.trailingPe !== null && fund?.trailingPe !== undefined
      ? [{ label: 'Stock P/E', value: `${fund.trailingPe.toFixed(1)}x` }]
      : []),
    ...(fund?.roePct !== null && fund?.roePct !== undefined
      ? [{ label: 'ROE', value: `${fund.roePct.toFixed(1)}%` }]
      : []),
    ...(fund?.earningsGrowthPct !== null && fund?.earningsGrowthPct !== undefined
      ? [{ label: 'PAT Growth', value: `${fund.earningsGrowthPct >= 0 ? '+' : ''}${fund.earningsGrowthPct.toFixed(1)}%` }]
      : []),
    ...(fund?.revenueGrowthPct !== null && fund?.revenueGrowthPct !== undefined
      ? [{ label: 'Sales Growth', value: `${fund.revenueGrowthPct >= 0 ? '+' : ''}${fund.revenueGrowthPct.toFixed(1)}%` }]
      : []),
    ...(fund?.debtToEquityRatio !== null && fund?.debtToEquityRatio !== undefined && !isFinancialSector(stockInfo.sector)
      ? [{ label: 'Debt / Equity', value: `${fund.debtToEquityRatio.toFixed(2)}x` }]
      : []),
    ...(fund?.priceToBook !== null && fund?.priceToBook !== undefined
      ? [{ label: 'Price / Book', value: `${fund.priceToBook.toFixed(2)}x` }]
      : []),
    {
      label: '52-Week Range',
      value: `${fmtCurrency(m.fiftyTwoWeekLow, m.currency)} – ${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)}`,
    },
    { label: '50 / 200 EMA', value: `${fmtCurrency(m.ema50, m.currency)} / ${fmtCurrency(m.ema200, m.currency)}` },
    { label: 'RSI (14) · Vol', value: `${m.rsi14} · ${m.volumeRatio}x` },
    { label: 'Daily ATR (14)', value: `${fmtCurrency(m.atr14, m.currency)} (${m.atrPct.toFixed(1)}%)` },
    { label: 'Valuation Basis', value: valuation.basisLabel },
  ].slice(0, 12);

  const momentum = [
    { period: '1 Week', returnPct: `${m.ret1W >= 0 ? '+' : ''}${m.ret1W}%` },
    { period: '1 Month', returnPct: `${m.ret1M >= 0 ? '+' : ''}${m.ret1M}%` },
    { period: '3 Months', returnPct: `${m.ret3M >= 0 ? '+' : ''}${m.ret3M}%` },
    { period: '1 Year', returnPct: `${m.ret1Y >= 0 ? '+' : ''}${m.ret1Y}%` },
  ];

  const liveFundSummaryLine = fund
    ? [
        fund.roePct !== null ? `ROE ${fund.roePct.toFixed(1)}%` : '',
        fund.trailingPe !== null ? `P/E ${fund.trailingPe.toFixed(1)}x` : '',
        fund.revenueGrowthPct !== null ? `Sales ${fund.revenueGrowthPct >= 0 ? '+' : ''}${fund.revenueGrowthPct.toFixed(1)}%` : '',
        fund.earningsGrowthPct !== null ? `Profit ${fund.earningsGrowthPct >= 0 ? '+' : ''}${fund.earningsGrowthPct.toFixed(1)}%` : '',
        !isFinancialSector(stockInfo.sector) && fund.debtToEquityRatio !== null ? `Debt/Equity ${fund.debtToEquityRatio.toFixed(2)}x` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : `${stockInfo.roeHint}. ${stockInfo.growthHint}`;

  const strengths = [
    m.currentPrice >= m.ema50
      ? `Price 50 EMA (${fmtCurrency(m.ema50, m.currency)}) ke upar bullish structure me hai.`
      : `52W low (${fmtCurrency(m.fiftyTwoWeekLow, m.currency)}) ke upar support build kar raha hai.`,
    `Daily liquidity strong (${m.currency === '₹' ? `₹${m.avgTurnoverCr.toFixed(0)} Cr/day` : `$${m.avgTurnoverCr.toFixed(0)}M/day`}) · ${mtfInfo.label}.`,
    liveFundSummaryLine || stockInfo.roeHint,
  ];

  const weaknesses = [
    fund?.trailingPe && fund.trailingPe > 48
      ? `Stock P/E (${fund.trailingPe.toFixed(1)}x) premium zone me hai — dip par disciplined entry rakhein.`
      : m.rsi14 > 70
        ? `RSI (${m.rsi14}) elevated hai — sharp dip/pullback risk.`
        : m.currentPrice < m.ema200
          ? `Price abhi 200 EMA (${fmtCurrency(m.ema200, m.currency)}) ke neeche hai.`
          : `52-week high (${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)}) ke paas supply resistance aa sakta hai.`,
    news.hasNegativeRedFlag
      ? `Recent negative headline notice hui hai — news verify karein.`
      : `Strict Stop Loss ${fmtCurrency(risk.stopLoss, m.currency)} (${risk.slLogic}) follow karein.`,
  ];

  const sources: GroundingSource[] = [
    {
      index: 1,
      title: `${resolved.symbol} Live Exchange & Fundamental Data`,
      uri: m.chartUrl,
      domain: 'finance.yahoo.com',
    },
    ...news.sources.map((s, idx) => ({ ...s, index: idx + 2 })),
  ];

  return {
    id: `hdr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    query,
    symbol: resolved.symbol,
    companyName: m.companyName || stockInfo.name,
    exchange: m.exchange,
    sector: stockInfo.sector,
    currency: m.currency,
    currentPrice: m.currentPrice,
    prevClose: m.prevClose,
    dayChangePct: m.dayChangePct,
    asOfDate: m.asOfDate,
    hdRating: evalRes.hdRating,
    fairValue,
    fairValueUpsidePct,
    verdict:
      bestFitSection === 'avoid'
        ? m.rsi14 > 78
          ? 'Overbought — Wait Pullback'
          : 'Weak / Risky — Avoid Now'
        : (overallSignal === 'Strong Buy' || overallSignal === 'Buy') && evalRes.hdRating >= 6.8
          ? 'Bullish — Structured Entry'
          : 'Neutral — Wait Confirmation',
    bestFitSection,
    mtfEligible: mtfInfo.eligible,
    simpleSummary: isEn
      ? `${m.companyName} is trading at ${fmtCurrency(m.currentPrice, m.currency)} (${m.dayChangePct >= 0 ? '+' : ''}${m.dayChangePct}% on ${m.asOfDate}). Fair value estimate is ${fmtCurrency(fairValue, m.currency)} (${fairValueUpsidePct >= 0 ? '+' : ''}${fairValueUpsidePct}% via ${valuation.basisLabel}). Technical structure is ${overallSignal} (RSI ${m.rsi14}, ATR ${m.atrPct.toFixed(1)}%/d).`
      : `${m.companyName} abhi ${fmtCurrency(m.currentPrice, m.currency)} (${m.dayChangePct >= 0 ? '+' : ''}${m.dayChangePct}%, data ${m.asOfDate}) par trade kar raha hai. Live Fair Value ${fmtCurrency(fairValue, m.currency)} (${fairValueUpsidePct >= 0 ? '+' : ''}${fairValueUpsidePct}%, ${valuation.basisLabel}) hai. Technical structure ${overallSignal} hai (RSI ${m.rsi14}, ATR ${m.atrPct.toFixed(1)}%/day).`,
    keyIndicators,
    technicalSummary: {
      overall: overallSignal,
      movingAverages: maSignal,
      indicators: indSignal,
    },
    momentum,
    strengths,
    weaknesses,
    bullCase: [
      `Data-driven Target 1 (${fmtCurrency(risk.target1, m.currency)}) & Target 2 (${fmtCurrency(risk.target2, m.currency)}): ${risk.targetLogic}.`,
      liveFundSummaryLine || stockInfo.growthHint,
      `Fair value (${fmtCurrency(fairValue, m.currency)}) based on ${valuation.basisLabel}.`,
    ],
    bearCase: [
      `Break below ${fmtCurrency(risk.stopLoss, m.currency)} (${risk.slLogic}) invalidates setup.`,
      fund?.trailingPe && fund.trailingPe > 45
        ? `Rich valuation (P/E ${fund.trailingPe.toFixed(1)}x) increases earnings disappointment drawdown risk.`
        : `Broader market pullback or weak quarterly guidance can cap upside near ${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)}.`,
    ],
    swot: {
      strengths: [
        liveFundSummaryLine || stockInfo.roeHint,
        `High liquidity (${m.currency === '₹' ? `₹${m.avgTurnoverCr.toFixed(0)} Cr/day` : `$${m.avgTurnoverCr.toFixed(0)}M/day`})`,
      ],
      weaknesses: [
        `Daily ATR volatility of ${fmtCurrency(m.atr14, m.currency)} (${m.atrPct.toFixed(1)}%/day)`,
        fund?.trailingPe ? `Current P/E ${fund.trailingPe.toFixed(1)}x` : `Resistance near 52W High (${fmtCurrency(m.fiftyTwoWeekHigh, m.currency)})`,
      ],
      opportunities: [
        `Target path: ${risk.targetLogic}`,
        `Horizon: ${risk.holdingWindow} (${risk.expiryLogic})`,
      ],
      threats: [`Global / index volatility`, `Unexpected earnings or regulatory news`],
    },
    recentNews: news.items,
    trapAlert:
      m.rsi14 > 72
        ? `RSI ${m.rsi14} overbought zone ke kareeb hai — bina pullback chase mat karein.`
        : `Daily close ${fmtCurrency(risk.stopLoss, m.currency)} (${risk.slLogic}) ke neeche aaye to strict Stoploss follow karein.`,
    entryMin: risk.entryMin,
    entryMax: risk.entryMax,
    stopLoss: risk.stopLoss,
    target1: risk.target1,
    target2: risk.target2,
    riskReward: risk.riskReward,
    holdingWindow: risk.holdingWindow,
    expiryDays: risk.expiryDays,
    slLogic: risk.slLogic,
    targetLogic: risk.targetLogic,
    expiryLogic: risk.expiryLogic,
    mtfLeverage: mtfInfo.label,
    sectionPlans,
    entryRule: `Entry ${fmtCurrency(risk.entryMin, m.currency)}–${fmtCurrency(risk.entryMax, m.currency)} zone me lein jab 20 EMA (${fmtCurrency(m.ema20, m.currency)}) hold kare.`,
    exitRule: `Strict SL ${fmtCurrency(risk.stopLoss, m.currency)} (${risk.slLogic}). Target 1 (${fmtCurrency(risk.target1, m.currency)}) par 50% book karke Target 2 (${fmtCurrency(risk.target2, m.currency)}) tak trail karein.`,
    angles: {
      technical: {
        score: evalRes.angleScores.technical,
        summary: `20 EMA ${fmtCurrency(m.ema20, m.currency)}, 50 EMA ${fmtCurrency(m.ema50, m.currency)}, 200 EMA ${fmtCurrency(m.ema200, m.currency)}, RSI ${m.rsi14}, MACD Hist ${m.macdHist}.`,
        highlights: [`Moving Averages: ${maSignal}`, `Volume Ratio: ${m.volumeRatio}x avg`],
      },
      priceAction: {
        score: evalRes.angleScores.priceAction,
        summary: `${risk.targetLogic}. Support SL: ${risk.slLogic}.`,
        highlights: [`20D Range: ${fmtCurrency(m.low20, m.currency)}–${fmtCurrency(m.high20, m.currency)}`, `Expiry Speed: ${risk.expiryLogic}`],
      },
      fundamentals: {
        score: evalRes.angleScores.fundamentals,
        summary: liveFundSummaryLine || `${stockInfo.roeHint}. ${stockInfo.growthHint}.`,
        highlights: [
          `Fair Value: ${fmtCurrency(fairValue, m.currency)} (${valuation.basisLabel})`,
          fund?.profitMarginPct !== null && fund?.profitMarginPct !== undefined
            ? `Profit Margin: ${fund.profitMarginPct.toFixed(1)}%`
            : `Sector: ${stockInfo.sector}`,
        ],
      },
      news: {
        score: evalRes.angleScores.news,
        summary: news.items[0]?.title || 'No major adverse headline detected in live news feed.',
        highlights: news.items.slice(0, 2).map((n) => `${n.date}: ${n.title}`),
      },
      safety: {
        score: evalRes.angleScores.safety,
        summary: `Daily turnover ${m.currency === '₹' ? `₹${m.avgTurnoverCr.toFixed(1)} Cr` : `$${m.avgTurnoverCr.toFixed(1)}M`} · ${mtfInfo.label}.`,
        highlights: [`Strict SL: ${fmtCurrency(risk.stopLoss, m.currency)}`, `R:R ${risk.riskReward}`],
      },
    },
    parameters: evalRes.parameters,
    sources,
    language,
    market: resolved.market,
    createdAt: new Date().toISOString(),
  };
}
