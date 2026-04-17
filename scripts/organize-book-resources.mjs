import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const DRIVE_ROOT = "G:\\My Drive";
const KNOWLEDGE_ROOT = path.join(DRIVE_ROOT, "04_Knowledge");
const BOOK_ROOT = path.join(KNOWLEDGE_ROOT, "book-resources");
const QUARANTINE_ROOT = path.join(BOOK_ROOT, "_dedupe-quarantine");
const REPORT_ROOT = path.join(BOOK_ROOT, "_reports");
const LIBRARY_ROOT = path.join(BOOK_ROOT, "library-site");
const E_COURSES_ROOT = "E:\\[courses]\\book-resources";
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, "-");

const BOOKS = [];

BOOKS.push(
  {
    title: "30 AI Projects",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "projects"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\30 AI Projects.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\30-ai-projects_2025-05-26.pdf"
    ]
  },
  {
    title: "AI Engineering",
    author: "Chip Huyen",
    kind: "technical",
    tags: ["informatica", "ai-ml", "ai-engineering"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\AI Engineering.pdf"
    ]
  },
  {
    title: "AI Engineering - Building Applications",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "ai-engineering"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\AI Engineering - Building Applications.pdf"
    ]
  },
  {
    title: "Applied Machine Learning and AI for Engineers",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Applied-Machine-Learning-and-AI-for-Engineers.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Applied-Machine-Learning-and-AI-for-Engineers.pdf"
    ]
  },
  {
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    kind: "technical",
    tags: ["informatica", "ai-ml", "artificial-intelligence"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Artificial Intelligence. A modern approach (Stuart Russell  Peter Norvig) (Z-Library).pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Artificial Intelligence. A modern approach (Stuart Russell  Peter Norvig) (Z-Library).pdf"
    ]
  },
  {
    title: "ByteByteGo System Design",
    author: "",
    kind: "technical",
    tags: ["informatica", "software-engineering", "system-design"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\bytebytego-system-design-Linkedin_Posts_2024_Blue.pdf"
    ]
  },
  {
    title: "ChatGPT Decoded: A Beginner's Guide to AI-Enhanced Living",
    author: "",
    kind: "career-business",
    tags: ["career-business", "ai-business", "productivity"],
    categoryPath: ["career-business", "ai-business"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\ChatGPT Decoded  - A Beginner's Guide to AI-Enhanced Living.epub"
    ]
  },
  {
    title: "Computer Age Statistical Inference",
    author: "Bradley Efron, Trevor Hastie",
    kind: "technical",
    tags: ["informatica", "data-statistics", "machine-learning"],
    categoryPath: ["technical", "data-statistics"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Math-Statistics\\Computer Age Statistical Inference Algorithms, Evidence, and Data Science.pdf"
    ]
  },
  {
    title: "Cracking the Coding Interview",
    author: "Gayle Laakmann McDowell",
    kind: "technical",
    tags: ["informatica", "software-engineering", "career-business", "interviews"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\Cracking the Coding Interview_ - Gayle Laakman McDowell.pdf"
    ]
  },
  {
    title: "Deep Learning",
    author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
    kind: "technical",
    tags: ["informatica", "ai-ml", "deep-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Deep Learning by Ian Goodfellow, Yoshua Bengio, Aaron Courville.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Deep Learning by Ian Goodfellow, Yoshua Bengio, Aaron Courville.pdf"
    ]
  }
);

BOOKS.push(
  {
    title: "Building Machine Learning Powered Applications",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - building-machine-learning-powered-applications-going-from-idea-to-product.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - building-machine-learning-powered-applications-going-from-idea-to-product.pdf"
    ]
  },
  {
    title: "Simply Artificial Intelligence",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "artificial-intelligence"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\Simply Artificial Intelligence.pdf"
    ]
  },
  {
    title: "The Complete Guide to Linux",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "linux"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\The_Complete_Guide_To_Linux3ed.pdf"
    ]
  },
  {
    title: "The Complete Python Coding Manual",
    author: "",
    kind: "technical",
    tags: ["informatica", "programming", "python"],
    categoryPath: ["technical", "programming"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\The_Complete_Python_Coding_Manual_Ed23_2024.pdf"
    ]
  },
  {
    title: "The Ultimate Guide to Edge AI",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "edge-ai"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\00_Inbox\\2025-november\\he Ultimate Guide to Edge AI.pdf"
    ]
  },
  {
    title: "ASP.NET Core Web Development",
    author: "",
    kind: "technical",
    tags: ["informatica", "software-engineering", "web-development"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\aspnet-core - webDev.pdf"
    ]
  }
);

BOOKS.push(
  {
    title: "LLM Engineers Handbook",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "llm"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\LLM Engineers Handbook.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\LLM Engineers Handbook.pdf"
    ]
  },
  {
    title: "Machine Learning for Absolute Beginners",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - 0812_Machine-Learning-for-Absolute-Beginners.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - 0812_Machine-Learning-for-Absolute-Beginners.pdf"
    ]
  },
  {
    title: "Machine Learning: A Probabilistic Perspective",
    author: "Kevin P. Murphy",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - Machine Learning-A Probabilistic Perspective.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - Machine Learning-A Probabilistic Perspective.pdf"
    ]
  },
  {
    title: "ML Math",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "math"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Math.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML Math.pdf"
    ]
  },
  {
    title: "NLP with Transformer Models",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "nlp"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\NLP with Transformer models.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\NLP with Transformer models.pdf"
    ]
  },
  {
    title: "Pattern Recognition and Machine Learning",
    author: "Christopher Bishop",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf"
    ]
  },
  {
    title: "Practical MLOps",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "mlops"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - Practical MLOps_ Operationalizing Machine Learning Models.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - Practical MLOps_ Operationalizing Machine Learning Models.pdf"
    ]
  },
  {
    title: "Practical Statistics for Data Science",
    author: "",
    kind: "technical",
    tags: ["informatica", "data-statistics", "data-science"],
    categoryPath: ["technical", "data-statistics"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Math-Statistics\\Practical Statistics for DataScience.pdf"
    ]
  },
  {
    title: "Pro C# 10 with .NET 6",
    author: "Andrew Troelsen",
    kind: "technical",
    tags: ["informatica", "software-engineering", "dotnet"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\Pro.CSharp.10.with.NET.6.Andrew.Troelsen.pdf"
    ]
  },
  {
    title: "Python Programming and Machine Learning",
    author: "",
    kind: "technical",
    tags: ["informatica", "programming", "python", "machine-learning"],
    categoryPath: ["technical", "programming"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Python Programming And Maching Learning Understanding How To Code Within 24 Hours 2 In 1.epub"
    ]
  }
);

BOOKS.push(
  {
    title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    author: "Aurelien Geron",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\1 - ML - Hands-On_Machine_Learning_with_Scikit-Learn_Keras_and_Tensorflow_-_Aurelien_Geron.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\1 - ML - Hands-On_Machine_Learning_with_Scikit-Learn_Keras_and_Tensorflow_-_Aurelien_Geron.pdf"
    ]
  },
  {
    title: "Hands-On Machine Learning with Scikit-Learn and PyTorch",
    author: "Aurelien Geron",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Hands-On Machine Learning with Scikit-Learn and PyTorch (Second Early Release) (Aurelien Geron) (Z-Library).pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Hands-On Machine Learning with Scikit-Learn and PyTorch (Second Early Release) (Aurelien Geron) (Z-Library).pdf"
    ]
  },
  {
    title: "Hacking: The Art of Exploitation",
    author: "Jon Erickson",
    kind: "technical",
    tags: ["informatica", "systems-security", "security"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\cybersecurity\\Hacking- The Art of Exploitation (2nd ed. 2008) - Erickson.pdf"
    ]
  },
  {
    title: "Hacking with Kali Linux",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "security"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Hacking With Kali Linux - A Comprehensive, Step-By-Step Beginner's Guide to Learn Ethical Hacking.epub"
    ]
  },
  {
    title: "Home Networking Tricks and Tips",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "networking"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\HomeNetworking_Tricks_and_Tips-6Ed2024.pdf"
    ]
  },
  {
    title: "How To Start Your Own Business",
    author: "",
    kind: "career-business",
    tags: ["career-business", "freelancing-business", "entrepreneurship"],
    categoryPath: ["career-business", "freelancing-business"],
    sources: [
      "G:\\My Drive\\02_Career\\[FREELANCING]\\How To Start Your Own Business - The Facts Visually Explained 2021.pdf"
    ]
  },
  {
    title: "Kali Linux Revealed",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "linux"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Kali-Linux-Revealed-2021-edition.pdf"
    ]
  },
  {
    title: "Killer ChatGPT Prompts",
    author: "",
    kind: "career-business",
    tags: ["career-business", "ai-business", "marketing"],
    categoryPath: ["career-business", "ai-business"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Killer ChatGPT Prompts - Harness the Power of AI for Success and Profit.pdf"
    ]
  },
  {
    title: "Learn Python in A Week and Master It",
    author: "",
    kind: "technical",
    tags: ["informatica", "programming", "python"],
    categoryPath: ["technical", "programming"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Learn Python In A Week And Master It.pdf"
    ]
  },
  {
    title: "Learning Git: A Hands-On Approach",
    author: "",
    kind: "technical",
    tags: ["informatica", "software-engineering", "git"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\Learning Git A Hands-On Approach.pdf"
    ]
  }
);

BOOKS.push(
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    kind: "technical",
    tags: ["informatica", "software-engineering", "data-systems"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\Designing Data-Intensive Applications.pdf"
    ]
  },
  {
    title: "Designing Machine Learning Systems",
    author: "Chip Huyen",
    kind: "technical",
    tags: ["informatica", "ai-ml", "mlops"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\ML - Designing Machine Learning Systems An Iterative Process.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\ML - Designing Machine Learning Systems An Iterative Process.pdf"
    ]
  },
  {
    title: "European Junior Tech Search",
    author: "",
    kind: "career-business",
    tags: ["career-business", "job-search", "tech-market"],
    categoryPath: ["career-business", "job-search"],
    sources: [
      "G:\\My Drive\\02_Career\\[JobSearch]\\TechJobMarketAnalysis\\01 - European Junior Tech Search.pdf"
    ]
  },
  {
    title: "European Tech Job Market Analysis",
    author: "",
    kind: "career-business",
    tags: ["career-business", "job-search", "tech-market"],
    categoryPath: ["career-business", "job-search"],
    sources: [
      "G:\\My Drive\\02_Career\\[JobSearch]\\TechJobMarketAnalysis\\European Tech Job Market Analysis.pdf"
    ]
  },
  {
    title: "From Piacenza to \u20ac5K MRR",
    author: "",
    kind: "career-business",
    tags: ["career-business", "freelancing-business", "entrepreneurship"],
    categoryPath: ["career-business", "freelancing-business"],
    sources: [
      "G:\\My Drive\\02_Career\\[FREELANCING]\\From Piacenza to \u20ac5K MRR.pdf"
    ]
  },
  {
    title: "GANs in Action",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "deep-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Gans-in-action-deep-learning-with-generative-adversarial-networks.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Gans-in-action-deep-learning-with-generative-adversarial-networks.pdf"
    ]
  },
  {
    title: "Generative Deep Learning",
    author: "David Foster",
    kind: "technical",
    tags: ["informatica", "ai-ml", "deep-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Generative-Deep-Learning.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Generative-Deep-Learning.pdf"
    ]
  },
  {
    title: "Hands-On Generative AI with Transformers and Diffusion Models",
    author: "Omar Sanseviero, Pedro Cuenca",
    kind: "technical",
    tags: ["informatica", "ai-ml", "generative-ai"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Hands-On Generative AI with Transformers and Diffusion Models (Omar Sanseviero, Pedro Cuenca etc.) (Z-Library).pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Hands-On Generative AI with Transformers and Diffusion Models (Omar Sanseviero, Pedro Cuenca etc.) (Z-Library).pdf"
    ]
  },
  {
    title: "Hands-On Large Language Models",
    author: "Jay Alammar, Maarten Grootendorst",
    kind: "technical",
    tags: ["informatica", "ai-ml", "llm"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Hands-On Large Language Models Language Understanding and Generation (Jay Alammar, Maarten Grootendorst) (Z-Library).pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Hands-On Large Language Models Language Understanding and Generation (Jay Alammar, Maarten Grootendorst) (Z-Library).pdf"
    ]
  },
  {
    title: "Hands-On Machine Learning with PyTorch",
    author: "",
    kind: "technical",
    tags: ["informatica", "ai-ml", "machine-learning"],
    categoryPath: ["technical", "ai-ml"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\AI-Engineering\\ML Books collection\\Hands-On Machine Learning with Pytorch.pdf",
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\AI-ML\\ML Books collection\\Hands-On Machine Learning with Pytorch.pdf"
    ]
  }
);

BOOKS.push(
  {
    title: "Hacking: The Art of Exploitation",
    author: "Jon Erickson",
    kind: "technical",
    tags: ["informatica", "systems-security", "security"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\tech-projects\\cybersecurity\\Hacking- The Art of Exploitation (2nd ed. 2008) - Erickson.pdf"
    ]
  },
  {
    title: "Hacking with Kali Linux",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "security"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Hacking With Kali Linux - A Comprehensive, Step-By-Step Beginner's Guide to Learn Ethical Hacking.epub"
    ]
  },
  {
    title: "Home Networking Tricks and Tips",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "networking"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\HomeNetworking_Tricks_and_Tips-6Ed2024.pdf"
    ]
  },
  {
    title: "How To Start Your Own Business",
    author: "",
    kind: "career-business",
    tags: ["career-business", "freelancing-business", "entrepreneurship"],
    categoryPath: ["career-business", "freelancing-business"],
    sources: [
      "G:\\My Drive\\02_Career\\[FREELANCING]\\How To Start Your Own Business - The Facts Visually Explained 2021.pdf"
    ]
  },
  {
    title: "Kali Linux Revealed",
    author: "",
    kind: "technical",
    tags: ["informatica", "systems-security", "linux"],
    categoryPath: ["technical", "systems-security"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Kali-Linux-Revealed-2021-edition.pdf"
    ]
  },
  {
    title: "Killer ChatGPT Prompts",
    author: "",
    kind: "career-business",
    tags: ["career-business", "ai-business", "marketing"],
    categoryPath: ["career-business", "ai-business"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Killer ChatGPT Prompts - Harness the Power of AI for Success and Profit.pdf"
    ]
  },
  {
    title: "Learn Python in A Week and Master It",
    author: "",
    kind: "technical",
    tags: ["informatica", "programming", "python"],
    categoryPath: ["technical", "programming"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Archive\\other-projects\\Learn&Do\\FutureReads\\Learn Python In A Week And Master It.pdf"
    ]
  },
  {
    title: "Learning Git: A Hands-On Approach",
    author: "",
    kind: "technical",
    tags: ["informatica", "software-engineering", "git"],
    categoryPath: ["technical", "software-engineering"],
    sources: [
      "G:\\My Drive\\04_Knowledge\\Resources\\Books\\Software-Engineering\\Learning Git A Hands-On Approach.pdf"
    ]
  }
);

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function unique(items) {
  return [...new Set(items)];
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function statSafe(filePath) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function fileHash(filePath) {
  const hash = createHash("sha256");
  const handle = await fs.open(filePath, "r");
  const stream = handle.createReadStream();
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", async () => {
      await handle.close();
      resolve(hash.digest("hex"));
    });
    stream.on("error", async (error) => {
      await handle.close();
      reject(error);
    });
  });
}

function preferredExtension(filePaths) {
  const priorities = [".pdf", ".epub", ".azw3", ".mobi", ".djvu", ".docx", ".doc"];
  const extensions = unique(filePaths.map((entry) => path.extname(entry).toLowerCase()));
  for (const ext of priorities) {
    if (extensions.includes(ext)) {
      return ext;
    }
  }
  return path.extname(filePaths[0]).toLowerCase();
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function scoreCandidate(candidate, slugBase) {
  const inResources = candidate.path.includes("\\Resources\\Books\\");
  const inKnowledge = candidate.path.includes("\\04_Knowledge\\");
  const ext = path.extname(candidate.path).toLowerCase();
  const extScore = ext === ".pdf" ? 3 : ext === ".epub" ? 2 : 1;
  const baseName = path.parse(candidate.path).name.toLowerCase();
  const exactBase = baseName === slugBase ? 2 : baseName.startsWith(`${slugBase} (`) ? 1 : 0;
  return [
    exactBase,
    inResources ? 1 : 0,
    inKnowledge ? 1 : 0,
    candidate.size,
    candidate.mtimeMs,
    extScore
  ];
}

function compareScore(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) {
      continue;
    }
    return right[index] - left[index];
  }
  return 0;
}

async function safeMove(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  if (sourcePath === destinationPath) {
    return destinationPath;
  }

  if (!(await exists(sourcePath))) {
    if (await exists(destinationPath)) {
      return destinationPath;
    }
    throw new Error(`Source not found: ${sourcePath}`);
  }

  if (await exists(destinationPath)) {
    const sourceHash = await fileHash(sourcePath);
    const destinationHash = await fileHash(destinationPath);
    if (sourceHash === destinationHash) {
      await fs.unlink(sourcePath);
      return destinationPath;
    }

    const parsed = path.parse(destinationPath);
    let counter = 2;
    let candidate = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
    while (await exists(candidate)) {
      counter += 1;
      candidate = path.join(parsed.dir, `${parsed.name} (${counter})${parsed.ext}`);
    }
    destinationPath = candidate;
  }

  try {
    await fs.rename(sourcePath, destinationPath);
  } catch (error) {
    if (error.code !== "EXDEV") {
      throw error;
    }
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath);
  }

  return destinationPath;
}

async function safeCopy(sourcePath, destinationPath) {
  await ensureDir(path.dirname(destinationPath));
  if (!(await exists(sourcePath))) {
    if (await exists(destinationPath)) {
      return destinationPath;
    }
    throw new Error(`Source not found for copy: ${sourcePath}`);
  }
  if (await exists(destinationPath)) {
    const sourceHash = await fileHash(sourcePath);
    const destinationHash = await fileHash(destinationPath);
    if (sourceHash === destinationHash) {
      return destinationPath;
    }
  }
  await fs.copyFile(sourcePath, destinationPath);
  return destinationPath;
}

async function resolveBook(book) {
  const targetDir = path.join(BOOK_ROOT, ...book.categoryPath);
  const slugBase = slugify(book.title);
  const available = [];
  const candidatePaths = [...book.sources];

  if (await exists(targetDir)) {
    const names = await fs.readdir(targetDir);
    for (const name of names) {
      const parsed = path.parse(name).name.toLowerCase();
      if (parsed === slugBase || parsed.startsWith(`${slugBase} (`)) {
        candidatePaths.push(path.join(targetDir, name));
      }
    }
  }

  for (const sourcePath of unique(candidatePaths)) {
    const stats = await statSafe(sourcePath);
    if (!stats || !stats.isFile()) {
      continue;
    }
    available.push({
      path: sourcePath,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      hash: null
    });
  }

  if (!available.length) {
    return {
      book,
      status: "missing",
      message: "Nessuna sorgente disponibile"
    };
  }

  for (const item of available) {
    item.hash = await fileHash(item.path);
  }

  const sorted = [...available].sort((left, right) =>
    compareScore(scoreCandidate(left, slugBase), scoreCandidate(right, slugBase))
  );

  const canonical = sorted[0];
  const extension = preferredExtension(available.map((entry) => entry.path));
  const targetName = `${slugify(book.title)}${extension}`;
  const targetPath = path.join(BOOK_ROOT, ...book.categoryPath, targetName);

  const exactDuplicates = [];
  const variants = [];

  for (const item of available) {
    if (item.path === canonical.path) {
      continue;
    }

    const sizeDelta = canonical.size === 0
      ? 0
      : Math.abs(item.size - canonical.size) / canonical.size;

    if (item.hash === canonical.hash || item.size === canonical.size) {
      exactDuplicates.push({
        ...item,
        sizeDelta
      });
    } else {
      variants.push({
        ...item,
        sizeDelta
      });
    }
  }

  return {
    book,
    status: "ready",
    canonical,
    exactDuplicates,
    variants,
    targetPath
  };
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "codex-book-library/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.json();
}

function tokenScore(queryTitle, candidateTitle = "") {
  const wanted = unique(normalize(queryTitle).split(" ").filter(Boolean));
  const candidate = unique(normalize(candidateTitle).split(" ").filter(Boolean));
  if (!wanted.length || !candidate.length) {
    return 0;
  }

  let matches = 0;
  for (const token of wanted) {
    if (candidate.includes(token)) {
      matches += 1;
    }
  }

  return matches / wanted.length;
}

async function fetchCover(book, coverDir) {
  const coverSlug = slugify(book.title);
  const localPath = path.join(coverDir, `${coverSlug}.jpg`);
  if (await exists(localPath)) {
    return {
      localFileName: `${coverSlug}.jpg`,
      localPath,
      sourceUrl: null,
      provider: "cached"
    };
  }

  const query = encodeURIComponent(book.author ? `${book.title} ${book.author}` : book.title);
  const strategies = [
    async () => {
      const openLibrary = await getJson(`https://openlibrary.org/search.json?limit=8&title=${query}`);
      const docs = Array.isArray(openLibrary?.docs) ? openLibrary.docs : [];
      const ranked = docs
        .filter((doc) => doc.cover_i && doc.title)
        .map((doc) => ({
          score: tokenScore(book.title, doc.title) + (book.author && doc.author_name?.join(" ").toLowerCase().includes(book.author.split(",")[0].toLowerCase()) ? 0.2 : 0),
          pageUrl: doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org",
          imageUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        }))
        .sort((left, right) => right.score - left.score);

      return ranked[0] ?? null;
    },
    async () => {
      const googleBooks = await getJson(`https://www.googleapis.com/books/v1/volumes?maxResults=5&q=${query}`);
      const items = Array.isArray(googleBooks?.items) ? googleBooks.items : [];
      const ranked = items
        .filter((item) => item.volumeInfo?.title && item.volumeInfo?.imageLinks)
        .map((item) => {
          const links = item.volumeInfo.imageLinks;
          const imageUrl = links.extraLarge || links.large || links.medium || links.thumbnail || links.smallThumbnail;
          return {
            score: tokenScore(book.title, item.volumeInfo.title) + (book.author && (item.volumeInfo.authors ?? []).join(" ").toLowerCase().includes(book.author.split(",")[0].toLowerCase()) ? 0.2 : 0),
            pageUrl: item.volumeInfo.infoLink || item.selfLink || "https://books.google.com",
            imageUrl: imageUrl ? imageUrl.replace("http://", "https://") : null
          };
        })
        .filter((entry) => entry.imageUrl)
        .sort((left, right) => right.score - left.score);

      return ranked[0] ?? null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = await strategy();
      if (!result || result.score < 0.45) {
        continue;
      }

      const response = await fetch(result.imageUrl, {
        headers: {
          "user-agent": "codex-book-library/1.0",
          referer: result.pageUrl
        }
      });

      if (!response.ok) {
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 4096) {
        continue;
      }

      await fs.writeFile(localPath, buffer);
      return {
        localFileName: `${coverSlug}.jpg`,
        localPath,
        sourceUrl: result.pageUrl,
        provider: result.imageUrl.includes("openlibrary") ? "openlibrary" : "google-books"
      };
    } catch {
      continue;
    }
  }

  return null;
}

function buildHtml(catalog) {
  const dataJson = JSON.stringify(catalog);
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Book Resources Library</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      :root{--bg:#f5efe5;--panel:rgba(255,255,255,.86);--ink:#1f1f1c;--muted:#66685f;--line:rgba(31,31,28,.11);--accent:#15574e;--accent-soft:#d9efe9;--career:#9c4a18;--career-soft:#f6e3d6;--shadow:0 22px 56px rgba(41,34,21,.14)}
      *{box-sizing:border-box} body{margin:0;font-family:"Space Grotesk",system-ui,sans-serif;color:var(--ink);background:radial-gradient(circle at top left,rgba(21,87,78,.18),transparent 30%),radial-gradient(circle at top right,rgba(156,74,24,.16),transparent 26%),linear-gradient(180deg,#fbf7f0 0%,var(--bg) 100%)}
      .page{width:min(1240px,calc(100vw - 32px));margin:0 auto;padding:24px 0 56px}
      .hero,.toolbar,.panel{background:var(--panel);backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow)}
      .hero{display:grid;grid-template-columns:1.35fr .9fr;gap:24px;padding:30px;margin-bottom:24px}
      .eyebrow{margin:0 0 10px;color:var(--accent);font-size:.84rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
      h1,h2{margin:0;font-family:"Fraunces",serif;line-height:.95} h1{font-size:clamp(2.6rem,6vw,4.5rem);max-width:13ch}
      .lede{margin:16px 0 0;max-width:60ch;color:var(--muted);line-height:1.6}
      .subnote{margin:18px 0 0;color:var(--muted)}
      .stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .stat{padding:18px;border-radius:22px;background:rgba(255,255,255,.92);border:1px solid var(--line)}
      .stat span{display:block;font-size:.82rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
      .stat strong{display:block;margin-top:8px;font-size:1.55rem;font-family:"Fraunces",serif}
      .toolbar{padding:20px;margin-bottom:24px}
      .toolbar-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:14px}
      label{display:grid;gap:8px;color:var(--muted);font-size:.88rem}
      input{width:100%;min-height:50px;border-radius:16px;border:1px solid var(--line);padding:0 16px;font:inherit;background:#fff}
      .tag-strip,.meta{display:flex;flex-wrap:wrap;gap:10px}
      .tag-button,.chip{border-radius:999px;font:inherit}
      .tag-button{min-height:42px;padding:0 16px;border:1px solid var(--line);background:rgba(255,255,255,.86);font-weight:700;cursor:pointer}
      .tag-button.is-active{background:var(--accent);color:#fff;border-color:transparent}
      .tag-button[data-tag="career-business"].is-active,.tag-button[data-tag="job-search"].is-active,.tag-button[data-tag="freelancing-business"].is-active,.tag-button[data-tag="ai-business"].is-active{background:var(--career)}
      .panel{padding:24px}
      .section-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:18px}
      .section-meta{margin:0;color:var(--muted)}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
      .card{display:grid;grid-template-rows:auto 1fr;background:rgba(255,255,255,.94);border:1px solid var(--line);border-radius:22px;overflow:hidden}
      .cover{position:relative;aspect-ratio:3/4;background:linear-gradient(180deg,rgba(21,87,78,.17),rgba(21,87,78,.02)),linear-gradient(135deg,#efe3d4,#d8ebe4)}
      .card.career .cover{background:linear-gradient(180deg,rgba(156,74,24,.18),rgba(156,74,24,.04)),linear-gradient(135deg,#f2dfcf,#fbf2e7)}
      .cover img{width:100%;height:100%;object-fit:cover;display:block}
      .fallback{position:absolute;inset:0;display:grid;place-items:center;padding:18px;text-align:center;font-family:"Fraunces",serif;font-size:1.2rem}
      .pill{position:absolute;top:14px;left:14px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.9);font-size:.78rem;font-weight:700}
      .body{display:grid;gap:12px;padding:18px}
      .body h3{margin:0;font-size:1.05rem;line-height:1.25}
      .body p{margin:0;color:var(--muted)}
      .chip{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;background:var(--accent-soft);color:var(--accent);font-size:.8rem}
      .chip.career{background:var(--career-soft);color:var(--career)}
      .meta{justify-content:space-between;color:var(--muted);font-size:.88rem}
      .link{color:var(--accent);text-decoration:none;font-weight:700;font-size:.88rem}
      .empty{text-align:center;padding:36px 18px;color:var(--muted)}
      @media (max-width:900px){.hero,.toolbar-grid{grid-template-columns:1fr}}
      @media (max-width:600px){.page{width:min(100vw - 20px,100%);padding-top:14px}.hero,.toolbar,.panel{border-radius:22px}}
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div>
          <p class="eyebrow">Knowledge / Book Resources</p>
          <h1>Libreria tecnica e career del tuo Drive</h1>
          <p class="lede">Catalogo locale dei libri di informatica, programmazione, AI/ML e career-business. La vista iniziale e centrata sull'informatica; i libri di lavoro e business emergono con il tag dedicato.</p>
          <p class="subnote" id="generatedAt"></p>
        </div>
        <div class="stats">
          <div class="stat"><span>Libri totali</span><strong id="totalCount">-</strong></div>
          <div class="stat"><span>Informatica</span><strong id="technicalCount">-</strong></div>
          <div class="stat"><span>Career / Business</span><strong id="careerCount">-</strong></div>
          <div class="stat"><span>Copertine locali</span><strong id="coverCount">-</strong></div>
        </div>
      </section>
      <section class="toolbar">
        <div class="toolbar-grid">
          <label for="searchInput">
            <span>Cerca per titolo, autore o tag</span>
            <input id="searchInput" type="search" placeholder="Es. transformer, git, business, interview">
          </label>
          <div class="tag-strip" id="tagStrip"></div>
        </div>
      </section>
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">Catalogo</p>
            <h2>Libreria</h2>
          </div>
          <p class="section-meta" id="resultMeta">-</p>
        </div>
        <div class="grid" id="grid"></div>
        <div class="empty" id="emptyState" hidden>Nessun risultato per i filtri selezionati.</div>
      </section>
    </div>
    <script>
      const catalog = ${dataJson};
      const state = { query: "", tag: "informatica" };
      const el = {
        careerCount: document.querySelector("#careerCount"),
        coverCount: document.querySelector("#coverCount"),
        emptyState: document.querySelector("#emptyState"),
        generatedAt: document.querySelector("#generatedAt"),
        grid: document.querySelector("#grid"),
        resultMeta: document.querySelector("#resultMeta"),
        searchInput: document.querySelector("#searchInput"),
        tagStrip: document.querySelector("#tagStrip"),
        technicalCount: document.querySelector("#technicalCount"),
        totalCount: document.querySelector("#totalCount")
      };
      const TAGS = [
        ["all", "Tutti"], ["informatica", "Informatica"], ["ai-ml", "AI / ML"], ["software-engineering", "Software Engineering"], ["programming", "Programming"], ["systems-security", "Systems / Security"], ["data-statistics", "Data / Statistics"], ["career-business", "Career / Business"], ["job-search", "Job Search"], ["freelancing-business", "Freelancing / Business"], ["ai-business", "AI Business"]
      ];
      const normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase();
      const escapeHtml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      function renderTags() {
        el.tagStrip.innerHTML = TAGS.map(([key, label]) => \`<button class="tag-button \${state.tag === key ? "is-active" : ""}" data-tag="\${key}" type="button">\${label}</button>\`).join("");
        el.tagStrip.querySelectorAll("[data-tag]").forEach((button) => button.addEventListener("click", () => { state.tag = button.dataset.tag; renderTags(); render(); }));
      }
      function matches(item) {
        const tagOk = state.tag === "all" || (item.tags ?? []).includes(state.tag);
        if (!tagOk) return false;
        if (!state.query) return true;
        const haystack = normalize([item.title, item.author, ...(item.tags ?? []), item.kind].join(" "));
        return haystack.includes(normalize(state.query));
      }
      function card(item) {
        const cover = item.coverLocalPath ? \`<img src="\${escapeHtml(item.coverLocalPath)}" alt="Copertina di \${escapeHtml(item.title)}" loading="lazy">\` : \`<div class="fallback">\${escapeHtml(item.title)}</div>\`;
        const chips = (item.tags ?? []).map((tag) => \`<span class="chip \${tag.includes("career") || tag.includes("business") || tag === "job-search" ? "career" : ""}">\${escapeHtml(tag)}</span>\`).join("");
        const link = item.coverSourceUrl ? \`<a class="link" href="\${escapeHtml(item.coverSourceUrl)}" target="_blank" rel="noreferrer">Fonte copertina</a>\` : "";
        return \`<article class="card \${item.kind === "career-business" ? "career" : ""}"><div class="cover"><span class="pill">\${item.kind === "career-business" ? "Career / Business" : "Informatica"}</span>\${cover}</div><div class="body"><div><h3>\${escapeHtml(item.title)}</h3><p>\${escapeHtml(item.author || "Autore non disponibile")}</p></div><div class="tag-strip">\${chips}</div><div class="meta"><span>\${escapeHtml(item.extension.replace(".", "").toUpperCase())}</span><span>\${escapeHtml(item.sizeLabel)}</span></div>\${link}</div></article>\`;
      }
      function render() {
        const items = catalog.books.filter(matches);
        el.grid.innerHTML = items.map(card).join("");
        el.resultMeta.textContent = \`\${items.length} titoli visibili\`;
        el.emptyState.hidden = items.length > 0;
      }
      el.totalCount.textContent = catalog.summary.totalBooks;
      el.technicalCount.textContent = catalog.summary.technicalBooks;
      el.careerCount.textContent = catalog.summary.careerBooks;
      el.coverCount.textContent = catalog.summary.coverCount;
      el.generatedAt.textContent = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(catalog.generatedAt));
      el.searchInput.addEventListener("input", (event) => { state.query = event.target.value; render(); });
      renderTags();
      render();
    </script>
  </body>
</html>`;
}

async function copyDirectory(sourceDir, destinationDir) {
  await ensureDir(destinationDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await safeCopy(sourcePath, destinationPath);
    }
  }
}

async function main() {
  const configuredBooks = [...new Map(BOOKS.map((book) => [book.title, book])).values()];

  await Promise.all([
    ensureDir(BOOK_ROOT),
    ensureDir(QUARANTINE_ROOT),
    ensureDir(REPORT_ROOT),
    ensureDir(LIBRARY_ROOT),
    ensureDir(E_COURSES_ROOT)
  ]);

  const resolutions = [];
  for (const book of configuredBooks) {
    resolutions.push(await resolveBook(book));
  }

  const missing = resolutions.filter((entry) => entry.status === "missing");
  const ready = resolutions.filter((entry) => entry.status === "ready");
  const moved = [];
  const quarantined = [];
  const variants = [];
  const catalogBooks = [];
  const coverDir = path.join(LIBRARY_ROOT, "covers");
  const dataDir = path.join(LIBRARY_ROOT, "data");

  await Promise.all([ensureDir(coverDir), ensureDir(dataDir)]);

  for (const entry of ready) {
    const extension = path.extname(entry.targetPath).toLowerCase();
    const canonicalDestination = await safeMove(entry.canonical.path, entry.targetPath);
    moved.push({ title: entry.book.title, from: entry.canonical.path, to: canonicalDestination });

    for (const duplicate of entry.exactDuplicates) {
      const quarantinePath = path.join(
        QUARANTINE_ROOT,
        RUN_STAMP,
        ...entry.book.categoryPath,
        path.basename(duplicate.path)
      );
      const finalQuarantinePath = await safeMove(duplicate.path, quarantinePath);
      quarantined.push({
        title: entry.book.title,
        from: duplicate.path,
        to: finalQuarantinePath,
        sizeDelta: Number(duplicate.sizeDelta.toFixed(4))
      });
    }

    for (const variant of entry.variants) {
      variants.push({
        title: entry.book.title,
        path: variant.path,
        sizeLabel: formatBytes(variant.size),
        sizeDelta: Number(variant.sizeDelta.toFixed(4))
      });
    }

    const targetInECourses = path.join(E_COURSES_ROOT, ...entry.book.categoryPath, path.basename(canonicalDestination));
    await safeCopy(canonicalDestination, targetInECourses);
    const cover = await fetchCover(entry.book, coverDir);

    catalogBooks.push({
      title: entry.book.title,
      author: entry.book.author,
      kind: entry.book.kind,
      tags: entry.book.tags,
      extension,
      sizeLabel: formatBytes(entry.canonical.size),
      sourcePath: canonicalDestination,
      eCoursesPath: targetInECourses,
      coverLocalPath: cover ? `./covers/${cover.localFileName}` : null,
      coverSourceUrl: cover?.sourceUrl ?? null,
      coverProvider: cover?.provider ?? null
    });
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalBooks: catalogBooks.length,
      technicalBooks: catalogBooks.filter((book) => book.kind === "technical").length,
      careerBooks: catalogBooks.filter((book) => book.kind === "career-business").length,
      coverCount: catalogBooks.filter((book) => book.coverLocalPath).length
    },
    books: catalogBooks.sort((left, right) => left.title.localeCompare(right.title, "it"))
  };

  await fs.writeFile(path.join(dataDir, "book-library-catalog.json"), JSON.stringify(catalog, null, 2), "utf8");
  await fs.writeFile(path.join(LIBRARY_ROOT, "index.html"), buildHtml(catalog), "utf8");
  await copyDirectory(LIBRARY_ROOT, path.join(E_COURSES_ROOT, "library-site"));

  const report = {
    generatedAt: new Date().toISOString(),
    roots: {
      driveBookRoot: BOOK_ROOT,
      quarantineRoot: QUARANTINE_ROOT,
      eCoursesRoot: E_COURSES_ROOT,
      libraryRoot: LIBRARY_ROOT
    },
    summary: {
      configuredBooks: configuredBooks.length,
      processedBooks: ready.length,
      missingBooks: missing.length,
      exactDuplicatesQuarantined: quarantined.length,
      variantsLeftInPlace: variants.length
    },
    missing,
    moved,
    quarantined,
    variants
  };

  await fs.writeFile(path.join(REPORT_ROOT, "book-reorg-report.json"), JSON.stringify(report, null, 2), "utf8");
  await fs.writeFile(
    path.join(REPORT_ROOT, "book-reorg-report.md"),
    [
      "# Book Resources Reorganization",
      "",
      `Generated at: ${report.generatedAt}`,
      "",
      `Processed books: ${report.summary.processedBooks}/${report.summary.configuredBooks}`,
      `Exact duplicates quarantined: ${report.summary.exactDuplicatesQuarantined}`,
      `Variants left in place for manual review: ${report.summary.variantsLeftInPlace}`,
      `Missing configured books: ${report.summary.missingBooks}`,
      "",
      "## Roots",
      `- Canonical library: ${BOOK_ROOT}`,
      `- Quarantine: ${QUARANTINE_ROOT}`,
      `- E courses mirror: ${E_COURSES_ROOT}`,
      `- HTML library: ${LIBRARY_ROOT}`,
      "",
      "## Notes",
      "- Exact duplicates are moved to quarantine instead of being permanently deleted.",
      "- Near-duplicates or title variants with different hashes remain in place and are listed in the JSON report."
    ].join("\n"),
    "utf8"
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
