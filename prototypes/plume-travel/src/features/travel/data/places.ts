// Worldwide places for the location search: every continent and country, a few hundred cities
// (not only the big beauty capitals) and neighborhoods. Production swaps this for a places API
// (Google Places Autocomplete or Mapbox Geocoding); anything not listed can still be searched.

export type PlaceKind = "continent" | "country" | "city" | "area" | "free";

export interface Place {
  kind: PlaceKind;
  name: string;
  city?: string;
  country?: string;
  continent?: string;
  popular?: boolean;
  includes?: string[]; // neighborhoods an area covers
}

const COUNTRIES_BY_CONTINENT: Record<string, string> = {
  Africa: "Algeria|Angola|Benin|Botswana|Burkina Faso|Burundi|Cabo Verde|Cameroon|Central African Republic|Chad|Comoros|Democratic Republic of the Congo|Republic of the Congo|Côte d'Ivoire|Djibouti|Egypt|Equatorial Guinea|Eritrea|Eswatini|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|São Tomé and Príncipe|Senegal|Seychelles|Sierra Leone|Somalia|South Africa|South Sudan|Sudan|Tanzania|Togo|Tunisia|Uganda|Zambia|Zimbabwe",
  Asia: "Afghanistan|Armenia|Azerbaijan|Bahrain|Bangladesh|Bhutan|Brunei|Cambodia|China|Georgia|Hong Kong|India|Indonesia|Iran|Iraq|Israel|Japan|Jordan|Kazakhstan|Kuwait|Kyrgyzstan|Laos|Lebanon|Macau|Malaysia|Maldives|Mongolia|Myanmar|Nepal|North Korea|Oman|Pakistan|Palestine|Philippines|Qatar|Saudi Arabia|Singapore|South Korea|Sri Lanka|Syria|Taiwan|Tajikistan|Thailand|Timor-Leste|Turkey|Turkmenistan|United Arab Emirates|Uzbekistan|Vietnam|Yemen",
  Europe: "Albania|Andorra|Austria|Belarus|Belgium|Bosnia and Herzegovina|Bulgaria|Croatia|Cyprus|Czechia|Denmark|Estonia|Finland|France|Germany|Greece|Hungary|Iceland|Ireland|Italy|Kosovo|Latvia|Liechtenstein|Lithuania|Luxembourg|Malta|Moldova|Monaco|Montenegro|Netherlands|North Macedonia|Norway|Poland|Portugal|Romania|Russia|San Marino|Serbia|Slovakia|Slovenia|Spain|Sweden|Switzerland|Ukraine|United Kingdom|Vatican City",
  "North America": "Antigua and Barbuda|Bahamas|Barbados|Belize|Canada|Costa Rica|Cuba|Dominica|Dominican Republic|El Salvador|Grenada|Guatemala|Haiti|Honduras|Jamaica|Mexico|Nicaragua|Panama|Puerto Rico|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Trinidad and Tobago|United States",
  "South America": "Argentina|Bolivia|Brazil|Chile|Colombia|Ecuador|Guyana|Paraguay|Peru|Suriname|Uruguay|Venezuela",
  Oceania: "Australia|Fiji|French Polynesia|Kiribati|Marshall Islands|Micronesia|Nauru|New Zealand|Palau|Papua New Guinea|Samoa|Solomon Islands|Tonga|Tuvalu|Vanuatu",
  Antarctica: "",
};

export const CONTINENT_OF: Record<string, string> = {};
for (const [continent, list] of Object.entries(COUNTRIES_BY_CONTINENT)) for (const c of list.split("|").filter(Boolean)) CONTINENT_OF[c] = continent;

/** City|Country. The first twenty are the popular list shown before typing. */
const CITY_LINES = `New York|United States
Paris|France
London|United Kingdom
Lisbon|Portugal
Seoul|South Korea
Tokyo|Japan
Los Angeles|United States
Miami|United States
Dubai|United Arab Emirates
Milan|Italy
Tulum|Mexico
Mexico City|Mexico
Barcelona|Spain
Copenhagen|Denmark
Sydney|Australia
Lagos|Nigeria
São Paulo|Brazil
Bali|Indonesia
Toronto|Canada
Marrakech|Morocco
Accra|Ghana
Nairobi|Kenya
Cape Town|South Africa
Johannesburg|South Africa
Zanzibar|Tanzania
Kigali|Rwanda
Dakar|Senegal
Cairo|Egypt
Tunis|Tunisia
Casablanca|Morocco
Essaouira|Morocco
Addis Ababa|Ethiopia
Abidjan|Côte d'Ivoire
Mombasa|Kenya
Port Louis|Mauritius
Windhoek|Namibia
Kampala|Uganda
Luanda|Angola
Kyoto|Japan
Osaka|Japan
Fukuoka|Japan
Sapporo|Japan
Busan|South Korea
Jeju|South Korea
Taipei|Taiwan
Hong Kong|Hong Kong
Shanghai|China
Beijing|China
Chengdu|China
Singapore|Singapore
Kuala Lumpur|Malaysia
Penang|Malaysia
Bangkok|Thailand
Chiang Mai|Thailand
Phuket|Thailand
Koh Samui|Thailand
Hanoi|Vietnam
Ho Chi Minh City|Vietnam
Hoi An|Vietnam
Da Nang|Vietnam
Siem Reap|Cambodia
Luang Prabang|Laos
Manila|Philippines
Cebu|Philippines
Jakarta|Indonesia
Yogyakarta|Indonesia
Colombo|Sri Lanka
Galle|Sri Lanka
Malé|Maldives
Mumbai|India
Delhi|India
Jaipur|India
Goa|India
Bengaluru|India
Kochi|India
Kathmandu|Nepal
Thimphu|Bhutan
Doha|Qatar
Abu Dhabi|United Arab Emirates
Muscat|Oman
Riyadh|Saudi Arabia
Jeddah|Saudi Arabia
AlUla|Saudi Arabia
Beirut|Lebanon
Amman|Jordan
Tel Aviv|Israel
Istanbul|Turkey
Bodrum|Turkey
Tbilisi|Georgia
Baku|Azerbaijan
Almaty|Kazakhstan
Samarkand|Uzbekistan
Rome|Italy
Florence|Italy
Venice|Italy
Naples|Italy
Amalfi|Italy
Capri|Italy
Madrid|Spain
Seville|Spain
Valencia|Spain
Ibiza|Spain
Mallorca|Spain
San Sebastián|Spain
Porto|Portugal
Sintra|Portugal
Comporta|Portugal
Funchal|Portugal
Berlin|Germany
Munich|Germany
Hamburg|Germany
Baden-Baden|Germany
Vienna|Austria
Salzburg|Austria
Zurich|Switzerland
Geneva|Switzerland
Amsterdam|Netherlands
Rotterdam|Netherlands
Brussels|Belgium
Antwerp|Belgium
Stockholm|Sweden
Oslo|Norway
Helsinki|Finland
Reykjavík|Iceland
Dublin|Ireland
Edinburgh|United Kingdom
Bath|United Kingdom
Manchester|United Kingdom
Prague|Czechia
Budapest|Hungary
Warsaw|Poland
Kraków|Poland
Athens|Greece
Mykonos|Greece
Santorini|Greece
Chania|Greece
Dubrovnik|Croatia
Split|Croatia
Ljubljana|Slovenia
Tallinn|Estonia
Riga|Latvia
Vilnius|Lithuania
Monaco|Monaco
Nice|France
Cannes|France
Lyon|France
Bordeaux|France
Marseille|France
Grasse|France
Aix-en-Provence|France
Saint-Tropez|France
Valletta|Malta
Bucharest|Romania
Sofia|Bulgaria
Chicago|United States
San Francisco|United States
Austin|United States
Nashville|United States
New Orleans|United States
Atlanta|United States
Houston|United States
Dallas|United States
Washington|United States
Boston|United States
Philadelphia|United States
Seattle|United States
Portland|United States
Denver|United States
Scottsdale|United States
Sedona|United States
Las Vegas|United States
Palm Springs|United States
San Diego|United States
Honolulu|United States
Charleston|United States
Savannah|United States
Detroit|United States
Minneapolis|United States
Montreal|Canada
Vancouver|Canada
Calgary|Canada
Banff|Canada
Quebec City|Canada
Cancún|Mexico
Oaxaca|Mexico
Guadalajara|Mexico
San Miguel de Allende|Mexico
Los Cabos|Mexico
Puerto Vallarta|Mexico
San Juan|Puerto Rico
Havana|Cuba
Kingston|Jamaica
Montego Bay|Jamaica
Nassau|Bahamas
Bridgetown|Barbados
Punta Cana|Dominican Republic
San José|Costa Rica
Panama City|Panama
Antigua Guatemala|Guatemala
Port of Spain|Trinidad and Tobago
Buenos Aires|Argentina
Mendoza|Argentina
Rio de Janeiro|Brazil
Salvador|Brazil
Florianópolis|Brazil
Santiago|Chile
Valparaíso|Chile
Bogotá|Colombia
Medellín|Colombia
Cartagena|Colombia
Lima|Peru
Cusco|Peru
Quito|Ecuador
Montevideo|Uruguay
Punta del Este|Uruguay
La Paz|Bolivia
Melbourne|Australia
Brisbane|Australia
Perth|Australia
Byron Bay|Australia
Gold Coast|Australia
Auckland|New Zealand
Queenstown|New Zealand
Wellington|New Zealand
Nadi|Fiji
Papeete|French Polynesia
Bora Bora|French Polynesia`;

/** Area|City|neighborhoods it covers (comma separated, optional). */
const AREA_LINES = `Brooklyn|New York|Williamsburg,Greenpoint,DUMBO,Brooklyn
Williamsburg|New York|
Greenpoint|New York|
Manhattan|New York|SoHo,Greenwich Village,West Village,Lower East Side,Chelsea,Manhattan
SoHo|New York|
Greenwich Village|New York|
West Village|New York|
Lower East Side|New York|
Harlem|New York|
Le Marais|Paris|
Saint-Germain|Paris|
9th arrondissement|Paris|
Montmartre|Paris|
Alfama|Lisbon|
Chiado|Lisbon|
Príncipe Real|Lisbon|
Seongsu|Seoul|
Gangnam|Seoul|
Hannam|Seoul|
Bukchon|Seoul|
Shibuya|Tokyo|
Ginza|Tokyo|
Omotesando|Tokyo|
Mayfair|London|
Marylebone|London|
Shoreditch|London|
Notting Hill|London|
Tulum Beach|Tulum|
Aldea Zamá|Tulum|
Roma Norte|Mexico City|
Condesa|Mexico City|
Silver Lake|Los Angeles|
West Hollywood|Los Angeles|
Wynwood|Miami|
Miami Beach|Miami|
Ubud|Bali|
Canggu|Bali|
Seminyak|Bali|
Medina|Marrakech|
Bondi|Sydney|
Ikoyi|Lagos|
Victoria Island|Lagos|
Jardins|São Paulo|
Brera|Milan|
El Born|Barcelona|
Gràcia|Barcelona|
Vesterbro|Copenhagen|
Queen West|Toronto|
Jumeirah|Dubai|`;

const cityCountry: Record<string, string> = {};

export const PLACES: Place[] = (() => {
  const out: Place[] = [];
  CITY_LINES.split("\n").forEach((line, i) => {
    const [name, country] = line.split("|");
    cityCountry[name] = country;
    out.push({ kind: "city", name, country, continent: CONTINENT_OF[country], popular: i < 20 });
  });
  for (const line of AREA_LINES.split("\n")) {
    const [name, city, inc] = line.split("|");
    const country = cityCountry[city];
    out.push({ kind: "area", name, city, country, continent: CONTINENT_OF[country], includes: inc ? inc.split(",") : [name] });
  }
  for (const [country, continent] of Object.entries(CONTINENT_OF)) out.push({ kind: "country", name: country, continent });
  for (const continent of Object.keys(COUNTRIES_BY_CONTINENT)) out.push({ kind: "continent", name: continent });
  return out;
})();

export const POPULAR = PLACES.filter((p) => p.popular);

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const KIND_ORDER: Record<PlaceKind, number> = { city: 0, area: 1, country: 2, continent: 3, free: 4 };

/** Accent-insensitive type-ahead over cities, areas, countries and continents. */
export function searchPlaces(q: string, limit = 8): Place[] {
  const n = norm(q);
  if (!n) return [];
  const scored: [number, Place][] = [];
  for (const p of PLACES) {
    const name = norm(p.name);
    let s = -1;
    if (name === n) s = 0;
    else if (name.startsWith(n)) s = 1;
    else if (name.split(/[\s-]/).some((w) => w.startsWith(n))) s = 2;
    else if (n.length >= 3 && name.includes(n)) s = 3;
    if (s >= 0) scored.push([s * 10 + KIND_ORDER[p.kind] + (p.popular ? -0.5 : 0), p]);
  }
  return scored.sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, p]) => p);
}

export function placeSubtitle(p: Place) {
  if (p.kind === "city") return p.country ?? "";
  if (p.kind === "area") return [p.city, p.country].filter(Boolean).join(", ");
  if (p.kind === "country") return `Country in ${p.continent}`;
  if (p.kind === "continent") return "Continent";
  return "Search everywhere for this place";
}

export function findPlace(name: string): Place | undefined {
  const n = norm(name);
  return PLACES.find((p) => norm(p.name) === n);
}

export function placeLabel(p: Place) {
  return p.kind === "area" ? `${p.name}, ${p.city}` : p.name;
}
