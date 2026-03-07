---
title: "Embedding 与向量搜索详解：AI 的语义理解基础"
order: 11
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-embedding-vector-search"
summary: "深入讲解 Embedding 向量化、向量数据库、语义搜索的原理和实战应用。"
icon: "🔢"
featured: false
toc: true
updated: 2026-03-06
---

> Embedding 是 AI 理解语义的基础，将文本转换为向量后，才能实现语义搜索、推荐系统、RAG 等高级应用。

## 一、什么是 Embedding？

### 1.1 定义

**Embedding（嵌入）= 将文本转换为向量（数字数组）的技术**

用一个比喻理解：
- **文本** = 人类语言（"猫"、"狗"、"高兴"）
- **Embedding** = 机器语言（[0.1, -0.5, 0.8, ...]）
- **向量空间** = 语义地图（相似概念在空间中距离近）

### 1.2 可视化理解

```
┌─────────────────────────────────────────────────────────────────┐
│                    向量空间示意图                                │
│                                                                 │
│                        ▲                                        │
│                      狗 │  猫                                   │
│                        │  ●                                     │
│                        │   ●                                   │
│                        │     ●  宠物                            │
│                        │                                       │
│         ◄──────────────┼──────────────►                        │
│                        │                                       │
│                  汽车 ●│                                       │
│                    ●   │                                       │
│                  飞机  │  ● 火车                               │
│                        │     交通工具                           │
│                                                                 │
│  语义相似的词 → 在向量空间中距离近                               │
│  语义不同的词 → 在向量空间中距离远                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 实际例子

```
文本 → Embedding 向量（简化版，实际是 768-1536 维）

"猫" → [0.8, -0.2, 0.5, 0.1, -0.6, ...]
"狗" → [0.7, -0.3, 0.4, 0.2, -0.5, ...]  ← 与"猫"相似
"汽车" → [-0.5, 0.6, -0.3, 0.8, 0.1, ...]  ← 与"猫"不同

计算相似度：
cosine_similarity("猫", "狗") = 0.92  ← 很相似
cosine_similarity("猫", "汽车") = 0.15  ← 不相似
```

### 1.4 Embedding 的核心特性

| 特性 | 描述 | 应用 |
|------|------|------|
| **语义相似性** | 相似概念的向量距离近 | 语义搜索、推荐 |
| **类比推理** | 向量支持数学运算 | "国王 - 男人 + 女人 = 女王" |
| **多语言支持** | 不同语言的相同概念向量接近 | 跨语言搜索 |
| **上下文感知** | 同一词在不同语境下向量不同 | 消歧义、精准搜索 |

---

## 二、Embedding 模型

### 2.1 主流模型对比（2026 年 3 月）

| 模型 | 维度 | 最大长度 | 语言 | 特点 |
|------|------|---------|------|------|
| **text-embedding-3-large** | 3072 | 8191 | 多语言 | OpenAI，效果最好，2024 |
| **text-embedding-3-small** | 1536 | 8191 | 多语言 | OpenAI，性价比高，2024 |
| **bge-large-zh-v1.5** | 1024 | 512 | 中文优化 | 中文场景首选 |
| **bge-m3** | 1024 | 8192 | 多语言 | 2024 新款，多语言支持 |
| **m3e-base** | 768 | 512 | 中文优化 | 中文语义理解好 |
| **multilingual-e5-large** | 1024 | 512 | 多语言 | 微软，多语言支持好 |

### 2.2 选型建议

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| **中文搜索** | bge-large-zh | 中文优化，效果好 |
| **多语言** | text-embedding-3 | 支持 100+ 语言 |
| **成本敏感** | m3e-base | 开源免费 |
| **长文本** | text-embedding-3 | 支持 8K tokens |
| **高精度** | text-embedding-3-large | 3072 维，最准确 |

### 2.3 使用示例

**OpenAI：**
```python
from openai import OpenAI

client = OpenAI(api_key="your-api-key")

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="今天天气不错"
)

embedding = response.data[0].embedding
print(f"向量维度：{len(embedding)}")
# 输出：向量维度：1536
```

**本地模型（bge-large-zh）：**
```python
from FlagEmbedding import FlagModel

model = FlagModel('BAAI/bge-large-zh-v1.5',
                  query_instruction_for_retrieval="为这个句子生成表示以用于检索：")

# 编码单个句子
embedding = model.encode("今天天气不错")
print(f"向量维度：{len(embedding)}")  # 1024

# 批量编码
sentences = ["今天天气不错", "我想去公园散步"]
embeddings = model.encode(sentences)
print(f"批量编码形状：{embeddings.shape}")  # (2, 1024)
```

---

## 三、向量相似度计算

### 3.1 常用相似度算法

| 算法 | 公式 | 特点 | 适用场景 |
|------|------|------|---------|
| **余弦相似度** | cos(θ) = A·B / (‖A‖‖B‖) | 最常用，忽略向量长度 | 文本相似度 |
| **欧氏距离** | d = √Σ(Ai - Bi)² | 考虑绝对距离 | 聚类分析 |
| **点积** | A·B = ΣAiBi | 计算快 | 推荐系统 |
| **曼哈顿距离** | d = Σ|Ai - Bi| | 对异常值鲁棒 | 特定场景 |

### 3.2 余弦相似度详解

```
公式：cosine_similarity(A, B) = (A · B) / (‖A‖ × ‖B‖)

例子：
A = [0.8, -0.2, 0.5, 0.1]
B = [0.7, -0.3, 0.4, 0.2]

点积 A·B = 0.8×0.7 + (-0.2)×(-0.3) + 0.5×0.4 + 0.1×0.2
        = 0.56 + 0.06 + 0.20 + 0.02
        = 0.84

‖A‖ = √(0.8² + (-0.2)² + 0.5² + 0.1²) = √0.94 = 0.97
‖B‖ = √(0.7² + (-0.3)² + 0.4² + 0.2²) = √0.78 = 0.88

cosine_similarity = 0.84 / (0.97 × 0.88) = 0.98

结果解读：
1.0 → 完全相同
0.8-1.0 → 非常相似
0.5-0.8 → 中等相似
0.0-0.5 → 不太相似
0.0 → 完全无关
-1.0 → 完全相反
```

### 3.3 代码实现

```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# 方法 1：手动计算
def cosine_sim_manual(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# 方法 2：用 sklearn
def cosine_sim_sklearn(a, b):
    return cosine_similarity([a], [b])[0][0]

# 批量计算相似度
def batch_similarity(query_embedding, doc_embeddings):
    """计算查询向量与多个文档向量的相似度"""
    similarities = cosine_similarity(
        [query_embedding],
        doc_embeddings
    )[0]
    return similarities

# 示例
query = "今天天气不错"
docs = ["天气很好", "我想吃饭", "晴天适合出门"]

# 生成向量
query_emb = model.encode(query)
doc_embs = model.encode(docs)

# 计算相似度
sims = batch_similarity(query_emb, doc_embs)
print(sims)  # [0.85, 0.32, 0.78]

# 排序
top_idx = np.argsort(sims)[::-1]
print(f"最相似：{docs[top_idx[0]]}")  # 天气很好
```

---

## 四、向量数据库

### 4.1 为什么需要向量数据库？

**问题：** 当向量数量很大时，暴力搜索太慢

```
场景：100 万个文档向量

暴力搜索：
• 计算查询向量与 100 万个向量的相似度
• 每次查询需要 100 万次计算
• 查询时间：~1 秒

向量数据库（用索引）：
• 用 HNSW 等索引结构
• 只需计算几百次
• 查询时间：~10 毫秒

速度提升：100 倍！
```

### 4.2 主流向量数据库对比（2026 年 3 月）

| 数据库 | 类型 | 最新版本 | 特点 | 适用场景 |
|--------|------|---------|------|---------|
| **Chroma** | 嵌入式 | 0.5.x | 轻量、易用、Python 原生 | 原型开发、小规模 |
| **Milvus** | 分布式 | 2.4.x | 高性能、支持 GPU | 生产环境、大规模 |
| **Qdrant** | 分布式 | 1.12.x | 过滤能力强、API 友好 | 生产环境 |
| **Pinecone** | 托管服务 | - | 免运维、新推 Serverless | 快速上线 |
| **Weaviate** | 分布式 | 1.25.x | 支持混合搜索、GraphQL | 复杂查询 |
| **FAISS** | 库 | 1.9.x | Facebook 开源、速度快 | 嵌入到应用中 |

### 4.3 Chroma 使用示例

```python
import chromadb
from chromadb.config import Settings

# 1. 初始化客户端
client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_db"
))

# 2. 创建集合
collection = client.create_collection(
    name="documents",
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 3. 添加文档
documents = [
    "今天天气不错",
    "我想去公园散步",
    "Python 是一门编程语言",
    "机器学习很有趣"
]

# 生成向量（用 OpenAI 或本地模型）
embeddings = [model.encode(doc) for doc in documents]

collection.add(
    embeddings=embeddings,
    documents=documents,
    ids=["doc1", "doc2", "doc3", "doc4"],
    metadatas=[
        {"category": "生活"},
        {"category": "生活"},
        {"category": "技术"},
        {"category": "技术"}
    ]
)

# 4. 查询
query = "天气怎么样"
query_embedding = model.encode(query)

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=2,  # 返回最相似的 2 个
    where={"category": "生活"}  # 过滤条件
)

print(results["documents"])
# 输出：[['今天天气不错', '我想去公园散步']]

print(results["distances"])
# 输出：[[0.15, 0.32]]  # 距离越小越相似
```

### 4.4 Milvus 使用示例

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType

# 1. 连接 Milvus
connections.connect("default", host="localhost", port="19530")

# 2. 定义 Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1024),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100)
]
schema = CollectionSchema(fields, "文档向量集合")

# 3. 创建集合
collection = Collection("documents", schema)

# 4. 创建索引（HNSW）
index_params = {
    "index_type": "HNSW",
    "metric_type": "COSINE",
    "params": {"M": 16, "efConstruction": 200}
}
collection.create_index("embedding", index_params)

# 5. 插入数据
data = [
    [1, 2, 3, 4],  # ids
    embeddings,     # 向量
    documents,      # 文本
    ["生活", "生活", "技术", "技术"]  # 分类
]
collection.insert(data)

# 6. 加载到内存
collection.load()

# 7. 搜索
query_embedding = model.encode("天气怎么样")

search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 100}
}

results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=2,
    expr="category == '生活'"  # 过滤
)

# 处理结果
for hit in results[0]:
    print(f"相似度：{1 - hit.distance}")  # 距离转相似度
    print(f"文本：{hit.entity.text}")
```

---

## 五、语义搜索实战

### 5.1 完整搜索系统

```python
class SemanticSearchEngine:
    """语义搜索引擎"""
    
    def __init__(self, embedding_model, vector_db):
        self.model = embedding_model
        self.db = vector_db
    
    def index(self, documents: list, metadata: list = None):
        """索引文档"""
        # 生成向量
        embeddings = self.model.encode(documents)
        
        # 存储到向量数据库
        self.db.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadata or [{}]*len(documents),
            ids=[f"doc_{i}" for i in range(len(documents))]
        )
    
    def search(self, query: str, top_k: int = 5, filter_dict: dict = None) -> list:
        """语义搜索"""
        # 生成查询向量
        query_embedding = self.model.encode(query)
        
        # 搜索
        results = self.db.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_dict
        )
        
        # 格式化结果
        formatted = []
        for i in range(len(results["documents"][0])):
            formatted.append({
                "text": results["documents"][0][i],
                "score": 1 - results["distances"][0][i],  # 距离转相似度
                "metadata": results["metadatas"][0][i] if results["metadatas"] else None
            })
        
        return formatted
    
    def hybrid_search(self, query: str, keyword: str = None, top_k: int = 5) -> list:
        """混合搜索（语义 + 关键词）"""
        # 语义搜索
        semantic_results = self.search(query, top_k=top_k*2)
        
        # 关键词过滤（如果有）
        if keyword:
            semantic_results = [
                r for r in semantic_results
                if keyword.lower() in r["text"].lower()
            ]
        
        # 重新排序（语义分数为主）
        return sorted(semantic_results, key=lambda x: x["score"], reverse=True)[:top_k]


# 使用示例
engine = SemanticSearchEngine(model, chroma_collection)

# 索引文档
docs = [
    "Python 是一门编程语言",
    "机器学习需要数学基础",
    "深度学习是机器学习的分支",
    "Python 在 AI 领域应用广泛"
]
engine.index(docs)

# 搜索
results = engine.search("编程需要什么语言", top_k=2)
for r in results:
    print(f"{r['score']:.2f} - {r['text']}")
# 输出：
# 0.85 - Python 是一门编程语言
# 0.72 - Python 在 AI 领域应用广泛
```

### 5.2 混合搜索（语义 + 关键词）

```python
def hybrid_search(query: str, vector_results, keyword_results, alpha=0.7):
    """
    混合搜索：结合语义搜索和关键词搜索
    
    alpha: 语义搜索权重（0-1）
    alpha=0.7 → 语义 70% + 关键词 30%
    """
    # 合并结果
    all_docs = {}
    
    for i, doc in enumerate(vector_results):
        all_docs[doc["id"]] = {
            "doc": doc,
            "semantic_score": doc["score"],
            "keyword_score": 0
        }
    
    for i, doc in enumerate(keyword_results):
        if doc["id"] in all_docs:
            all_docs[doc["id"]]["keyword_score"] = doc["score"]
        else:
            all_docs[doc["id"]] = {
                "doc": doc,
                "semantic_score": 0,
                "keyword_score": doc["score"]
            }
    
    # 计算加权分数
    for item in all_docs.values():
        item["final_score"] = (
            alpha * item["semantic_score"] +
            (1 - alpha) * item["keyword_score"]
        )
    
    # 排序
    sorted_results = sorted(
        all_docs.values(),
        key=lambda x: x["final_score"],
        reverse=True
    )
    
    return [item["doc"] for item in sorted_results]
```

---

## 六、RAG 中的应用

### 6.1 RAG 检索流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    RAG 检索流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 文档预处理                                                   │
│     原始文档 → 切片 → 生成向量 → 存入向量数据库                   │
│                                                                 │
│  2. 用户提问                                                     │
│     "北京天气怎么样？"                                           │
│                                                                 │
│  3. 生成查询向量                                                 │
│     问题 → Embedding 模型 → 查询向量                              │
│                                                                 │
│  4. 向量检索                                                     │
│     查询向量 → 向量数据库 → Top-K 相似片段                        │
│                                                                 │
│  5. 增强 Prompt                                                  │
│     [检索到的片段] + [用户问题] → 增强后的 Prompt                 │
│                                                                 │
│  6. LLM 生成回答                                                 │
│     增强 Prompt → LLM → 基于事实的回答                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 检索优化技巧

| 技巧 | 描述 | 效果提升 |
|------|------|---------|
| **多向量检索** | 用多个查询向量检索 | +10-15% 召回率 |
| **重排序（Re-Rank）** | 用 Cross-Encoder 重排序 | +15-20% 准确率 |
| **混合检索** | 向量 + 关键词结合 | +10-15% 综合效果 |
| **查询扩展** | 生成多个相关问题 | +5-10% 召回率 |
| **元数据过滤** | 用元数据预过滤 | 提升精度，减少噪声 |

### 6.3 Re-Rank 示例

```python
from sentence_transformers import CrossEncoder

# 加载重排序模型
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank_results(query: str, results: list, top_k: int = 5) -> list:
    """用 Cross-Encoder 重排序"""
    
    # 准备输入
    pairs = [[query, r["text"]] for r in results]
    
    # 计算分数
    scores = reranker.predict(pairs)
    
    # 附加分数
    for i, r in enumerate(results):
        r["rerank_score"] = scores[i]
    
    # 排序
    sorted_results = sorted(
        results,
        key=lambda x: x["rerank_score"],
        reverse=True
    )
    
    return sorted_results[:top_k]


# 使用
initial_results = engine.search(query, top_k=20)  # 先检索 20 个
final_results = rerank_results(query, initial_results, top_k=5)  # 重排序取 5 个
```

---

## 🎯 面试回答版本

> 面试官问："你了解 Embedding 和向量搜索吗？"

### 标准回答（2-3 分钟）

```
Embedding 是将文本转换为向量的技术，让机器能理解语义。

【核心原理】
文本 → Embedding 模型 → 向量（768-3072 维）
相似概念的向量距离近，用余弦相似度计算。

【主流模型】
中文场景：bge-large-zh、m3e-base
多语言：OpenAI text-embedding-3、multilingual-e5
选型看场景：中文用 bge，多语言用 OpenAI。

【向量数据库】
我用过 Chroma（轻量）、Milvus（生产）。
核心是用 HNSW 索引加速搜索，从 O(n) 到 O(log n)。

【实际应用】
在 RAG 项目中，我用 Embedding 实现语义检索：
1. 文档切片后生成向量存入数据库
2. 用户提问时检索相似片段
3. 用重排序提升准确率 15-20%
4. 最终检索准确率达到 85%+

【优化技巧】
混合检索（向量 + 关键词）、Re-Rank 重排序、
元数据过滤、查询扩展等。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "余弦相似度和欧氏距离有什么区别？" | 余弦看方向（忽略长度），欧氏看绝对距离。文本相似度常用余弦。 |
| "向量数据库怎么加速搜索？" | 用 HNSW、IVF 等索引结构，将暴力搜索 O(n) 优化到 O(log n)。 |
| "如何提升检索准确率？" | 1) 选好 Embedding 模型 2) 混合检索 3) Re-Rank 重排序 4) 优化切片策略。 |
| "Embedding 和 LLM 有什么区别？" | Embedding 是编码模型，输出固定长度向量；LLM 是生成模型，输出文本。 |

---

**相关阅读：**
- [RAG 技术详解](./ai-rag-deep-dive.md) - 学习检索增强生成
- [Token 机制详解](./ai-token-basics.md) - 理解文本处理
- [LLM 大语言模型详解](./ai-llm-intro.md) - 了解模型原理
