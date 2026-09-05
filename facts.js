const facts = [
  {
    "id": "fact001",
    "topic": "Leukoencephalopathies",
    "difficulty": "Easy",
    "prompt": "Which virus causes progressive multifocal leukoencephalopathy (PML)?",
    "options": [
      "JC virus",
      "EBV",
      "CMV",
      "HSV-1"
    ],
    "answer": "JC virus",
    "explanation": "PML results from reactivation of JC polyomavirus in immunosuppressed individuals and produces multifocal demyelinating lesions, typically involving subcortical white matter."
  },
  {
    "id": "fact002",
    "topic": "Leukoencephalopathies",
    "difficulty": "Moderate",
    "prompt": "Which MRI pattern is most characteristic of PML?",
    "options": [
      "Symmetric periventricular lesions with Dawson fingers",
      "Asymmetric T2/FLAIR hyperintense subcortical white-matter lesions without mass effect",
      "Bilateral basal-ganglia lesions with marked enhancement",
      "Isolated cerebellar atrophy"
    ],
    "answer": "Asymmetric T2/FLAIR hyperintense subcortical white-matter lesions without mass effect",
    "explanation": "PML typically produces asymmetric, multifocal T2/FLAIR hyperintense white-matter lesions, often involving juxtacortical/subcortical regions, with relatively little mass effect."
  },
  {
    "id": "fact003",
    "topic": "Leukoencephalopathies",
    "difficulty": "Easy",
    "prompt": "Which genetic abnormality is classically responsible for CADASIL?",
    "options": [
      "NOTCH3 mutation",
      "HTT CAG expansion",
      "FXN GAA expansion",
      "ATP7B mutation"
    ],
    "answer": "NOTCH3 mutation",
    "explanation": "CADASIL is an autosomal-dominant small-vessel disease caused by NOTCH3 variants, classically associated with migraine with aura, recurrent subcortical ischemic events, cognitive decline and psychiatric manifestations."
  },
  {
    "id": "fact004",
    "topic": "Leukoencephalopathies",
    "difficulty": "Moderate",
    "prompt": "Which MRI finding strongly suggests CADASIL?",
    "options": [
      "Isolated hippocampal atrophy",
      "Anterior temporal pole and external capsule white-matter lesions",
      "Predominant occipital cortical atrophy",
      "Bilateral optic-nerve enhancement"
    ],
    "answer": "Anterior temporal pole and external capsule white-matter lesions",
    "explanation": "White-matter hyperintensities involving the anterior temporal poles and external capsules are characteristic imaging clues for CADASIL."
  },
  {
    "id": "fact005",
    "topic": "Leukoencephalopathies",
    "difficulty": "Easy",
    "prompt": "Which enzyme deficiency causes metachromatic leukodystrophy?",
    "options": [
      "Arylsulfatase A",
      "Hexosaminidase A",
      "Galactocerebrosidase",
      "Adrenoleukodystrophy protein"
    ],
    "answer": "Arylsulfatase A",
    "explanation": "Metachromatic leukodystrophy is an autosomal-recessive lysosomal storage disorder caused by arylsulfatase A deficiency, resulting in sulfatide accumulation and progressive demyelination."
  },
  {
    "id": "fact006",
    "topic": "Leukoencephalopathies",
    "difficulty": "Moderate",
    "prompt": "Which abnormality is characteristic of X-linked adrenoleukodystrophy?",
    "options": [
      "Accumulation of very-long-chain fatty acids",
      "Accumulation of copper",
      "Accumulation of GM2 ganglioside",
      "Accumulation of α-synuclein"
    ],
    "answer": "Accumulation of very-long-chain fatty acids",
    "explanation": "X-linked adrenoleukodystrophy is caused by ABCD1-related peroxisomal dysfunction, resulting in accumulation of very-long-chain fatty acids (VLCFAs)."
  },
  {
    "id": "fact007",
    "topic": "Leukoencephalopathies",
    "difficulty": "Advanced",
    "prompt": "Which inherited disorder should be strongly considered in an adult with progressive cognitive decline, psychiatric symptoms, parkinsonism and characteristic white-matter disease?",
    "options": [
      "CSF1R-related adult-onset leukoencephalopathy (ALSP)",
      "Duchenne muscular dystrophy",
      "Myasthenia gravis",
      "Wilson disease"
    ],
    "answer": "CSF1R-related adult-onset leukoencephalopathy (ALSP)",
    "explanation": "CSF1R-related leukoencephalopathy (ALSP) is an important cause of progressive adult-onset white-matter disease, often featuring cognitive/psychiatric changes, gait dysfunction and parkinsonism."
  },
  {
    "id": "fact008",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Easy",
    "prompt": "Which inheritance pattern and mutation characterize Huntington disease?",
    "options": [
      "Autosomal dominant — CAG repeat expansion",
      "Autosomal recessive — GAA repeat expansion",
      "X-linked recessive — CGG expansion",
      "Mitochondrial — mtDNA deletion"
    ],
    "answer": "Autosomal dominant — CAG repeat expansion",
    "explanation": "Huntington disease is autosomal dominant and results from a CAG trinucleotide repeat expansion in HTT."
  },
  {
    "id": "fact009",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Moderate",
    "prompt": "In Huntington disease, anticipation is particularly associated with transmission through which parent?",
    "options": [
      "Mother",
      "Father",
      "Both equally",
      "Neither"
    ],
    "answer": "Father",
    "explanation": "Expansion of the HTT CAG repeat is particularly prone to occur during paternal transmission, producing genetic anticipation."
  },
  {
    "id": "fact010",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Easy",
    "prompt": "Which repeat expansion is characteristic of Friedreich ataxia?",
    "options": [
      "CAG",
      "GAA",
      "CTG",
      "CGG"
    ],
    "answer": "GAA",
    "explanation": "Friedreich ataxia is usually caused by a GAA expansion in the FXN gene, leading to reduced frataxin and mitochondrial dysfunction."
  },
  {
    "id": "fact011",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Easy",
    "prompt": "Which gene is mutated in Wilson disease?",
    "options": [
      "ATP7B",
      "ATP7A",
      "HTT",
      "PARK2"
    ],
    "answer": "ATP7B",
    "explanation": "Wilson disease is an autosomal-recessive copper metabolism disorder caused by ATP7B dysfunction, resulting in impaired biliary copper excretion."
  },
  {
    "id": "fact012",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Moderate",
    "prompt": "Which combination is particularly suggestive of neurological Wilson disease?",
    "options": [
      "Parkinsonism/dystonia + hepatic disease + Kayser–Fleischer rings",
      "Pure peripheral neuropathy + retinal degeneration",
      "Isolated lower motor neuron disease",
      "Pure cerebellar ataxia without systemic findings"
    ],
    "answer": "Parkinsonism/dystonia + hepatic disease + Kayser–Fleischer rings",
    "explanation": "Wilson disease may produce dystonia, tremor, parkinsonism, dysarthria and psychiatric symptoms, together with hepatic involvement and Kayser–Fleischer rings."
  },
  {
    "id": "fact013",
    "topic": "Hereditary neurodegenerative diseases",
    "difficulty": "Advanced",
    "prompt": "Which disorder is caused by a CAG repeat expansion in the ATN1 gene?",
    "options": [
      "Dentatorubral-pallidoluysian atrophy (DRPLA)",
      "Huntington disease",
      "Friedreich ataxia",
      "Spinocerebellar ataxia type 6"
    ],
    "answer": "Dentatorubral-pallidoluysian atrophy (DRPLA)",
    "explanation": "DRPLA is an autosomal-dominant CAG-repeat disorder caused by expansion in ATN1 and can produce ataxia, myoclonus, epilepsy and cognitive decline."
  },
  {
    "id": "fact014",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Easy",
    "prompt": "SCA3 is also known as:",
    "options": [
      "Machado–Joseph disease",
      "Ramsay Hunt syndrome",
      "Louis-Bar syndrome",
      "Shy-Drager syndrome"
    ],
    "answer": "Machado–Joseph disease",
    "explanation": "SCA3/Machado–Joseph disease is one of the common autosomal-dominant SCAs and is caused by a CAG repeat expansion in ATXN3."
  },
  {
    "id": "fact015",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Easy",
    "prompt": "Which repeat expansion causes SCA1?",
    "options": [
      "CAG expansion in ATXN1",
      "GAA expansion in FXN",
      "CTG expansion in DMPK",
      "CAG expansion in HTT"
    ],
    "answer": "CAG expansion in ATXN1",
    "explanation": "SCA1 is caused by a CAG repeat expansion in ATXN1 and commonly produces progressive cerebellar ataxia with pyramidal and other extracerebellar features."
  },
  {
    "id": "fact016",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Moderate",
    "prompt": "Which clinical feature is particularly useful as a clue to SCA2?",
    "options": [
      "Slow saccadic eye movements",
      "Retinitis pigmentosa",
      "Severe sensory neuropathy as the only manifestation",
      "Isolated dystonia"
    ],
    "answer": "Slow saccadic eye movements",
    "explanation": "Slow saccades are a classic clinical clue in SCA2, which is caused by a CAG repeat expansion in ATXN2."
  },
  {
    "id": "fact017",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Moderate",
    "prompt": "Which statement best describes SCA6?",
    "options": [
      "It is commonly a relatively pure cerebellar ataxia with later onset",
      "It is primarily a retinal degeneration syndrome",
      "It is an X-linked leukodystrophy",
      "It is caused by a GAA expansion in FXN"
    ],
    "answer": "It is commonly a relatively pure cerebellar ataxia with later onset",
    "explanation": "SCA6, caused by a CAG expansion in CACNA1A, often presents with a relatively pure, slowly progressive cerebellar ataxia and tends to have later onset than several other SCAs."
  },
  {
    "id": "fact018",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Easy",
    "prompt": "Which feature is particularly characteristic of SCA7?",
    "options": [
      "Retinal degeneration with progressive visual loss",
      "Severe peripheral neuropathy without ataxia",
      "Isolated lower motor neuron weakness",
      "Optic neuritis"
    ],
    "answer": "Retinal degeneration with progressive visual loss",
    "explanation": "SCA7 is notable for cone-rod dystrophy/retinal degeneration, making progressive visual impairment an important distinguishing feature."
  },
  {
    "id": "fact019",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Moderate",
    "prompt": "Which combination can occur in SCA3/Machado–Joseph disease?",
    "options": [
      "Ataxia, pyramidal signs, dystonia and parkinsonism",
      "Only cerebellar signs",
      "Only peripheral neuropathy",
      "Only cognitive impairment"
    ],
    "answer": "Ataxia, pyramidal signs, dystonia and parkinsonism",
    "explanation": "SCA3 has a broad phenotype and may include cerebellar ataxia, pyramidal signs, dystonia, parkinsonism, neuropathy and other extracerebellar manifestations."
  },
  {
    "id": "fact020",
    "topic": "Spinocerebellar ataxias",
    "difficulty": "Easy",
    "prompt": "Most of the classic spinocerebellar ataxias (SCAs) such as SCA1, SCA2, SCA3, SCA6 and SCA7 are inherited as:",
    "options": [
      "Autosomal dominant",
      "Autosomal recessive",
      "X-linked recessive",
      "Mitochondrial"
    ],
    "answer": "Autosomal dominant",
    "explanation": "The classic SCAs are predominantly autosomal-dominant inherited disorders, although hereditary ataxia as a whole includes many autosomal-recessive, X-linked and mitochondrial disorders."
  }
];
