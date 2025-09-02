export const DEFAULT_STRUKTUR_ORGANISASI = {
  direktorat: [
    {
      id: 1,
      nama: "Direktorat Bisnis Jasa Keuangan",
      kode: "DBJK",
      level: 1,
      parentId: null
    },
    {
      id: 2,
      nama: "Direktorat Bisnis Kurir dan Logistik",
      kode: "DBKL",
      level: 1,
      parentId: null
    },
    {
      id: 3,
      nama: "Direktorat Operasi dan Digital Services",
      kode: "DODS",
      level: 1,
      parentId: null
    },
    {
      id: 4,
      nama: "Direktorat Keuangan dan Manajemen Risiko",
      kode: "DKMR",
      level: 1,
      parentId: null
    },
    {
      id: 5,
      nama: "Direktorat Human Capital Management",
      kode: "DHCM",
      level: 1,
      parentId: null
    },
    {
      id: 6,
      nama: "Direktorat Business Development dan Portfolio Management",
      kode: "DBDPM",
      level: 1,
      parentId: null
    }
  ],
  
  subdirektorat: [
    // DBJK - Direktorat Bisnis Jasa Keuangan
    {
      id: 101,
      nama: "Sub Direktorat Government and Corporate Business",
      kode: "SDGCB",
      level: 2,
      parentId: 1
    },
    {
      id: 102,
      nama: "Sub Direktorat Consumer Business",
      kode: "SDCB",
      level: 2,
      parentId: 1
    },
    
    // DBKL - Direktorat Bisnis Kurir dan Logistik
    {
      id: 201,
      nama: "Sub Direktorat Enterprise Business",
      kode: "SDEB",
      level: 2,
      parentId: 2
    },
    {
      id: 202,
      nama: "Sub Direktorat Retail Business",
      kode: "SDRB",
      level: 2,
      parentId: 2
    },
    {
      id: 203,
      nama: "Sub Direktorat Wholesale and International Business",
      kode: "SDWIB",
      level: 2,
      parentId: 2
    },
    
    // DODS - Direktorat Operasi dan Digital Services
    {
      id: 301,
      nama: "Sub Direktorat Courier and Logistic Operation",
      kode: "SDCLO",
      level: 2,
      parentId: 3
    },
    {
      id: 302,
      nama: "Sub Direktorat International Post Services",
      kode: "SDIPS",
      level: 2,
      parentId: 3
    },
    {
      id: 303,
      nama: "Sub Direktorat Digital Services",
      kode: "SDDS",
      level: 2,
      parentId: 3
    },
    {
      id: 304,
      nama: "Sub Direktorat Fronting Management and Financial Transaction Service",
      kode: "SDFMFTS",
      level: 2,
      parentId: 3
    },
    
    // DKMR - Direktorat Keuangan dan Manajemen Risiko
    {
      id: 401,
      nama: "Sub Direktorat Financial Operations And Business Partner",
      kode: "SDFOBP",
      level: 2,
      parentId: 4
    },
    {
      id: 402,
      nama: "Sub Direktorat Financial Policy and Asset Management",
      kode: "SDFPAM",
      level: 2,
      parentId: 4
    },
    {
      id: 403,
      nama: "Sub Direktorat Risk Management",
      kode: "SDRM",
      level: 2,
      parentId: 4
    },
    
    // DHCM - Direktorat Human Capital Management
    {
      id: 501,
      nama: "Sub Direktorat Human Capital Policy and Strategy",
      kode: "SDHCPS",
      level: 2,
      parentId: 5
    },
    {
      id: 502,
      nama: "Sub Direktorat Human Capital Services and Business Partner",
      kode: "SDHCSBP",
      level: 2,
      parentId: 5
    },
    
    // DBDPM - Direktorat Business Development dan Portfolio Management
    {
      id: 601,
      nama: "Sub Direktorat Strategic Planning and Business Development",
      kode: "SDSPBD",
      level: 2,
      parentId: 6
    },
    {
      id: 602,
      nama: "Sub Direktorat Portfolio Management",
      kode: "SDPM",
      level: 2,
      parentId: 6
    }
  ],
  
  divisi: [
    // SDGCB - Government and Corporate Business
    {
      id: 1001,
      nama: "Divisi Penyaluran Dana",
      kode: "DPD",
      level: 3,
      parentId: 101
    },
    {
      id: 1002,
      nama: "Divisi Fronting Business",
      kode: "DFB",
      level: 3,
      parentId: 101
    },
    {
      id: 1003,
      nama: "Divisi Financial Services Marketing",
      kode: "DFSM",
      level: 3,
      parentId: 101
    },
    {
      id: 1004,
      nama: "Divisi Payment",
      kode: "DP",
      level: 3,
      parentId: 101
    },
    
    // SDCB - Consumer Business
    {
      id: 1101,
      nama: "Divisi Digital Giro and Payment Solution",
      kode: "DDGPS",
      level: 3,
      parentId: 102
    },
    {
      id: 1102,
      nama: "Divisi Remittance and Syariah Business",
      kode: "DRSB",
      level: 3,
      parentId: 102
    },
    {
      id: 1103,
      nama: "Divisi Modern Channel Financial Services",
      kode: "DMCFS",
      level: 3,
      parentId: 102
    },
    {
      id: 1104,
      nama: "Divisi Product Management",
      kode: "DPM",
      level: 3,
      parentId: 102
    },
    
    // SDEB - Enterprise Business
    {
      id: 2001,
      nama: "Divisi Account Management and Corporate Marketing",
      kode: "DACM",
      level: 3,
      parentId: 201
    },
    {
      id: 2002,
      nama: "Divisi Project Management",
      kode: "DPM",
      level: 3,
      parentId: 201
    },
    {
      id: 2003,
      nama: "Divisi Bidding and Collection Management",
      kode: "DBCM",
      level: 3,
      parentId: 201
    },
    {
      id: 2004,
      nama: "Divisi Solution, Partnership, Business Planning and Performance Management",
      kode: "DSPBPM",
      level: 3,
      parentId: 201
    },
    
    // SDRB - Retail Business
    {
      id: 2101,
      nama: "Divisi Digital Channel PosAja!",
      kode: "DDCP",
      level: 3,
      parentId: 202
    },
    {
      id: 2102,
      nama: "Divisi Marketing Retail Business",
      kode: "DMRB",
      level: 3,
      parentId: 202
    },
    {
      id: 2103,
      nama: "Divisi Penjualan Agenpos",
      kode: "DPA",
      level: 3,
      parentId: 202
    },
    {
      id: 2104,
      nama: "Divisi O-Ranger",
      kode: "DOR",
      level: 3,
      parentId: 202
    },
    {
      id: 2105,
      nama: "Divisi Kemitraan dan Solusi",
      kode: "DKS",
      level: 3,
      parentId: 202
    },
    
    // SDWIB - Wholesale and International Business
    {
      id: 2201,
      nama: "Divisi Wholesale and International Project",
      kode: "DWIP",
      level: 3,
      parentId: 203
    },
    {
      id: 2202,
      nama: "Divisi Wholesale and International Freight",
      kode: "DWIF",
      level: 3,
      parentId: 203
    },
    
    // SDCLO - Courier and Logistic Operation
    {
      id: 3001,
      nama: "Divisi Courier Operation",
      kode: "DCO",
      level: 3,
      parentId: 301
    },
    {
      id: 3002,
      nama: "Divisi Digital Operation and Quality Assurance",
      kode: "DDOQA",
      level: 3,
      parentId: 301
    },
    {
      id: 3003,
      nama: "Divisi Operation Cost Management and Partnership",
      kode: "DOCMP",
      level: 3,
      parentId: 301
    },
    {
      id: 3004,
      nama: "Divisi Logistic Operation",
      kode: "DLO",
      level: 3,
      parentId: 301
    },
    {
      id: 3005,
      nama: "Divisi Logistic Control and Solution",
      kode: "DLCS",
      level: 3,
      parentId: 301
    },
    
    // SDIPS - International Post Services
    {
      id: 3101,
      nama: "Divisi Operation Control",
      kode: "DOC",
      level: 3,
      parentId: 302
    },
    {
      id: 3102,
      nama: "Divisi Networking, Partnership and Process Operation Development",
      kode: "DNPPOD",
      level: 3,
      parentId: 302
    },
    
    // SDDS - Digital Services
    {
      id: 3201,
      nama: "Divisi Architecture and Governance",
      kode: "DAG",
      level: 3,
      parentId: 303
    },
    {
      id: 3202,
      nama: "Divisi Digital Channel",
      kode: "DDC",
      level: 3,
      parentId: 303
    },
    {
      id: 3203,
      nama: "Divisi Digital System Implementation",
      kode: "DDSI",
      level: 3,
      parentId: 303
    },
    {
      id: 3204,
      nama: "Divisi Digital System Operation",
      kode: "DDSO",
      level: 3,
      parentId: 303
    },
    {
      id: 3205,
      nama: "Divisi Network and Infrastructure",
      kode: "DNI",
      level: 3,
      parentId: 303
    },
    
    // SDFMFTS - Fronting Management and Financial Transaction Service
    {
      id: 3301,
      nama: "Divisi Kemitraan dan Inovasi Pelayanan",
      kode: "DKIP",
      level: 3,
      parentId: 304
    },
    {
      id: 3302,
      nama: "Divisi Operasi Pelayanan",
      kode: "DOP",
      level: 3,
      parentId: 304
    },
    {
      id: 3303,
      nama: "Divisi Operasi Jasa Keuangan",
      kode: "DOJK",
      level: 3,
      parentId: 304
    },
    
    // SDFOBP - Financial Operations And Business Partner
    {
      id: 4001,
      nama: "Divisi Treasury and Tax",
      kode: "DTAT",
      level: 3,
      parentId: 401
    },
    {
      id: 4002,
      nama: "Divisi Manajemen Keuangan",
      kode: "DMK",
      level: 3,
      parentId: 401
    },
    {
      id: 4003,
      nama: "Divisi Akuntansi",
      kode: "DA",
      level: 3,
      parentId: 401
    },
    
    // SDFPAM - Financial Policy and Asset Management
    {
      id: 4101,
      nama: "Divisi Investment Management",
      kode: "DIM",
      level: 3,
      parentId: 402
    },
    {
      id: 4102,
      nama: "Divisi Financial Policy",
      kode: "DFP",
      level: 3,
      parentId: 402
    },
    {
      id: 4103,
      nama: "Divisi Asset Management",
      kode: "DAM",
      level: 3,
      parentId: 402
    },
    
    // SDRM - Risk Management
    {
      id: 4201,
      nama: "Divisi Risk Management Policy and Strategy",
      kode: "DRMPS",
      level: 3,
      parentId: 403
    },
    {
      id: 4202,
      nama: "Divisi Enterprise Risk Management",
      kode: "DERM",
      level: 3,
      parentId: 403
    },
    {
      id: 4203,
      nama: "Divisi Fraud Management",
      kode: "DFM",
      level: 3,
      parentId: 403
    },
    
    // SDHCPS - Human Capital Policy and Strategy
    {
      id: 5001,
      nama: "Divisi Human Capital Policy",
      kode: "DHCP",
      level: 3,
      parentId: 501
    },
    {
      id: 5002,
      nama: "Divisi Human Capital Strategy",
      kode: "DHCS",
      level: 3,
      parentId: 501
    },
    {
      id: 5003,
      nama: "Divisi Culture Management",
      kode: "DCM",
      level: 3,
      parentId: 501
    },
    
    // SDHCSBP - Human Capital Services and Business Partner
    {
      id: 5101,
      nama: "Divisi Human Capital Services",
      kode: "DHCS",
      level: 3,
      parentId: 502
    },
    {
      id: 5102,
      nama: "Divisi Human Capital Development",
      kode: "DHCD",
      level: 3,
      parentId: 502
    },
    {
      id: 5103,
      nama: "Divisi Digital Learning Center",
      kode: "DDLC",
      level: 3,
      parentId: 502
    },
    {
      id: 5104,
      nama: "Divisi Human Capital Business Partner",
      kode: "DHCBP",
      level: 3,
      parentId: 502
    },
    {
      id: 5105,
      nama: "Divisi General Support",
      kode: "DGS",
      level: 3,
      parentId: 502
    },
    
    // SDSPBD - Strategic Planning and Business Development
    {
      id: 6001,
      nama: "Divisi Corporate Strategic Planning and Synergy Business",
      kode: "DCSPASB",
      level: 3,
      parentId: 601
    },
    {
      id: 6002,
      nama: "Divisi Corporate Performance",
      kode: "DCP",
      level: 3,
      parentId: 601
    },
    {
      id: 6003,
      nama: "Divisi Business Development, Innovation and Incubation",
      kode: "DBDII",
      level: 3,
      parentId: 601
    },
    {
      id: 6004,
      nama: "Divisi Customer Experience",
      kode: "DCE",
      level: 3,
      parentId: 601
    },
    
    // SDPM - Portfolio Management
    {
      id: 6101,
      nama: "Divisi Strategic Portfolio and Parenting",
      kode: "DSPP",
      level: 3,
      parentId: 602
    },
    {
      id: 6102,
      nama: "Divisi Transformation Management Office",
      kode: "DTMO",
      level: 3,
      parentId: 602
    },
    {
      id: 6103,
      nama: "Divisi Public Service Obligation",
      kode: "DPSO",
      level: 3,
      parentId: 602
    }
  ],
  
  // Special Units
  specialUnits: [
    {
      id: 7001,
      nama: "Corporate Secretary and Environmental, Social and Governance (ESG)",
      kode: "CSESG",
      level: 2,
      parentId: null,
      special: true
    },
    {
      id: 7002,
      nama: "Internal Audit",
      kode: "IA",
      level: 2,
      parentId: null,
      special: true
    },
    {
      id: 7003,
      nama: "Digital Services Tribe",
      kode: "DST",
      level: 2,
      parentId: null,
      special: true
    },
    {
      id: 7004,
      nama: "Business Development dan Portfolio Management Tribe",
      kode: "BDPMT",
      level: 2,
      parentId: null,
      special: true
    }
  ],
  
  // Regional Offices
  regional: [
    {
      id: 8001,
      nama: "Regional I",
      kode: "R1",
      level: 2,
      parentId: null,
      regional: true
    },
    {
      id: 8002,
      nama: "Regional II",
      kode: "R2",
      level: 2,
      parentId: null,
      regional: true
    },
    {
      id: 8003,
      nama: "Regional III",
      kode: "R3",
      level: 2,
      parentId: null,
      regional: true
    },
    {
      id: 8004,
      nama: "Regional IV",
      kode: "R4",
      level: 2,
      parentId: null,
      regional: true
    },
    {
      id: 8005,
      nama: "Regional V",
      kode: "R5",
      level: 2,
      parentId: null,
      regional: true
    },
    {
      id: 8006,
      nama: "Regional VI",
      kode: "R6",
      level: 2,
      parentId: null,
      regional: true
    }
  ]
};

export const getStrukturOrganisasiSummary = () => {
  return {
    totalDirektorat: DEFAULT_STRUKTUR_ORGANISASI.direktorat.length,
    totalSubdirektorat: DEFAULT_STRUKTUR_ORGANISASI.subdirektorat.length,
    totalDivisi: DEFAULT_STRUKTUR_ORGANISASI.divisi.length,
    totalSpecialUnits: DEFAULT_STRUKTUR_ORGANISASI.specialUnits.length,
    totalRegional: DEFAULT_STRUKTUR_ORGANISASI.regional.length,
    totalStruktur: DEFAULT_STRUKTUR_ORGANISASI.direktorat.length + 
                   DEFAULT_STRUKTUR_ORGANISASI.subdirektorat.length + 
                   DEFAULT_STRUKTUR_ORGANISASI.divisi.length + 
                   DEFAULT_STRUKTUR_ORGANISASI.specialUnits.length + 
                   DEFAULT_STRUKTUR_ORGANISASI.regional.length
  };
};



