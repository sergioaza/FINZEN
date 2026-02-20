export const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

export const CURRENCIES = [
  { value: "COP", label: "COP — Peso colombiano" },
  { value: "USD", label: "USD — Dólar estadounidense" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "MXN", label: "MXN — Peso mexicano" },
  { value: "ARS", label: "ARS — Peso argentino" },
  { value: "BRL", label: "BRL — Real brasileño" },
  { value: "CLP", label: "CLP — Peso chileno" },
  { value: "PEN", label: "PEN — Sol peruano" },
  { value: "UYU", label: "UYU — Peso uruguayo" },
  { value: "GBP", label: "GBP — Libra esterlina" },
];

export const COUNTRIES = [
  { value: "CO", label: "Colombia" },
  { value: "US", label: "Estados Unidos" },
  { value: "MX", label: "México" },
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "PE", label: "Perú" },
  { value: "UY", label: "Uruguay" },
  { value: "EC", label: "Ecuador" },
  { value: "VE", label: "Venezuela" },
  { value: "ES", label: "España" },
  { value: "GB", label: "Reino Unido" },
  { value: "DE", label: "Alemania" },
  { value: "FR", label: "Francia" },
];

// Moneda sugerida según país
export const COUNTRY_CURRENCY_MAP = {
  CO: "COP",
  US: "USD",
  MX: "MXN",
  AR: "ARS",
  BR: "BRL",
  CL: "CLP",
  PE: "PEN",
  UY: "UYU",
  EC: "USD",
  VE: "USD",
  ES: "EUR",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
};

// Idioma sugerido según país
export const COUNTRY_LOCALE_MAP = {
  CO: "es",
  US: "en",
  MX: "es",
  AR: "es",
  BR: "pt",
  CL: "es",
  PE: "es",
  UY: "es",
  EC: "es",
  VE: "es",
  ES: "es",
  GB: "en",
  DE: "es",
  FR: "es",
};
