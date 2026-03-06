---
title: "向量数据库详解：从原理到生产实践"
order: 12
section: "AI"
topic: "AI 技术"
lang: "zh"
slug: "ai-vector-database-deep-dive"
summary: "深入讲解向量数据库的工作原理、索引技术、主流产品对比，以及生产环境部署和优化方案。"
icon: "🗄️"
featured: false
toc: true
updated: 2026-03-06
---

> 向量数据库是 AI 应用的核心基础设施，支撑着语义搜索、推荐系统、RAG 等关键场景。本文从原理到实践全面解析。

## 一、为什么需要向量数据库？

### 1.1 传统数据库的局限

```
场景：在 1000 万个文档中搜索语义相似的内容

传统数据库（如 MySQL）：
• 只能做关键词匹配
• 无法理解"天气好"和"晴天"是相似意思
• 全文搜索（如 Elasticsearch）也只能做到词频统计

向量数据库：
• 将文本转换为向量
• 用向量距离衡量语义相似度
• 1000 万次搜索只需几十毫秒
```

### 1.2 暴力搜索 vs 索引搜索

```
┌─────────────────────────────────────────────────────────────────┐
│                    搜索性能对比                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  暴力搜索（Brute Force）                                        │
│  ━━━━━━━━━━━━━━━━━━━━━                                          │
│  • 计算查询向量与所有向量的相似度                                │
│  • 100 万向量 → 100 万次计算                                     │
│  • 查询时间：~1 秒                                               │
│  • 准确率：100%（精确解）                                        │
│                                                                 │
│  索引搜索（ANN - Approximate Nearest Neighbor）                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                            │
│  • 用索引结构快速定位候选集                                     │
│  • 100 万向量 → 几百次计算                                       │
│  • 查询时间：~10 毫秒                                            │
│  • 准确率：95-99%（近似解）                                      │
│                                                                 │
│  性能提升：100 倍！准确率损失：<5%                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 向量数据库的核心价值

| 价值 | 描述 | 实际效果 |
|------|------|---------|
| **高性能检索** | ANN 索引加速搜索 | 毫秒级查询 |
| **大规模存储** | 支持亿级向量 | 海量知识库 |
| **元数据过滤** | 向量 + 属性联合查询 | 精准检索 |
| **实时更新** | 支持增删改查 | 动态知识库 |
| **分布式扩展** | 水平扩展能力 | 应对高并发 |

---

## 二、向量索引技术详解

### 2.1 索引技术对比

| 索引类型 | 全称 | 原理 | 适用场景 |
|---------|------|------|---------|
| **HNSW** | Hierarchical Navigable Small World | 多层图结构 | 高精度、内存充足 |
| **IVF** | Inverted File Index | 倒排文件索引 | 大规模、磁盘存储 |
| **LSH** | Locality Sensitive Hashing | 局部敏感哈希 | 超大规模、低延迟 |
| **PQ** | Product Quantization | 乘积量化 | 压缩存储、节省内存 |
| **ANNOY** | Approximate Nearest Neighbors Oh Yeah | 随机投影树 | 只读场景、低内存 |

### 2.2 HNSW 索引详解

**工作原理：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    HNSW 索引结构                                 │
│                                                                 │
│  Layer 2 (顶层，节点少)                                          │
│      ●───────●                                                  │
│     /         \                                                 │
│    ●           ●                                                │
│                                                                 │
│  Layer 1 (中间层)                                                │
│      ●───●───●                                                  │
│     / \ / \ / \                                                 │
│    ●───●───●───●                                                │
│                                                                 │
│  Layer 0 (底层，所有节点)                                        │
│  ●─●─●─●─●─●─●─●─●─●─●─●─●─●                                  │
│                                                                 │
│  搜索过程：                                                      │
│  1. 从顶层入口节点开始                                           │
│  2. 在当前层找到最近邻                                           │
│  3. 下降到下一层，继续搜索                                       │
│  4. 到达底层，返回结果                                           │
│                                                                 │
│  优势：                                                          │
│  • 搜索复杂度：O(log N)                                          │
│  • 支持动态增删                                                  │
│  • 召回率高（95-99%）                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**HNSW 关键参数：**

| 参数 | 含义 | 推荐值 | 影响 |
|------|------|--------|------|
| **M** | 每个节点的最大连接数 | 16-64 | M 越大，精度越高，内存越多 |
| **efConstruction** | 构建时的搜索范围 | 100-400 | 越大，构建越慢，索引质量越好 |
| **efSearch** | 搜索时的候选集大小 | 50-200 | 越大，搜索越准，速度越慢 |

**Milvus 配置示例：**
```python
index_params = {
    "index_type": "HNSW",
    "metric_type": "COSINE",
    "params": {
        "M": 32,              # 连接数
        "efConstruction": 200  # 构建参数
    }
}
collection.create_index("embedding", index_params)
```

### 2.3 IVF 索引详解

**工作原理：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    IVF 索引结构                                  │
│                                                                 │
│  步骤 1：聚类（训练阶段）                                         │
│  ━━━━━━━━━━━━━━━━                                               │
│  • 用 K-Means 将向量聚成 nlist 个簇                               │
│  • 每个簇有一个质心（Centroid）                                  │
│  • 向量属于最近的质心                                            │
│                                                                 │
│     ●●●    ●●●●    ●●●    ●●●●●                                 │
│      ●      ●      ●      ●                                     │
│    簇 1    簇 2    簇 3    簇 4                                   │
│                                                                 │
│  步骤 2：搜索（查询阶段）                                         │
│  ━━━━━━━━━━━━━━━━━━                                             │
│  • 计算查询向量与各质心的距离                                    │
│  • 选择最近的 nprobe 个簇                                        │
│  • 只在选中的簇内暴力搜索                                        │
│                                                                 │
│  示例：                                                          │
│  nlist = 1000, nprobe = 10                                      │
│  • 传统暴力：搜索 100 万个向量                                    │
│  • IVF：搜索 10 个簇 × 1000 向量/簇 = 1 万向量                     │
│  • 加速：100 倍                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**IVF 关键参数：**

| 参数 | 含义 | 推荐值 | 影响 |
|------|------|--------|------|
| **nlist** | 聚类中心数量 | √N ~ 4√N | 越大，搜索越快，但训练越慢 |
| **nprobe** | 搜索时探查的簇数 | 10-100 | 越大，精度越高，速度越慢 |

**Faiss 实现示例：**
```python
import faiss

# 创建 IVF 索引
dimension = 768
nlist = 1000  # 聚类中心数量
quantizer = faiss.IndexFlatL2(dimension)  # 量化器
index = faiss.IndexIVFFlat(quantizer, dimension, nlist, faiss.METRIC_L2)

# 训练（需要一部分数据）
index.train(training_vectors)

# 添加向量
index.add(all_vectors)

# 搜索
index.nprobe = 10  # 探查 10 个簇
distances, indices = index.search(query_vectors, k=10)
```

### 2.4 乘积量化（PQ）

**原理：**

```
原始向量：768 维，每维 4 字节（float32）
        → 3072 字节/向量

PQ 压缩：将 768 维分成 8 段，每段 96 维
       每段用 256 个码向量表示
       每段只需 1 字节（0-255 的索引）
       → 8 字节/向量

压缩率：3072 / 8 = 384 倍！
精度损失：约 5-10%
```

**应用场景：**
- 海量向量存储（亿级以上）
- 内存受限场景
- 对精度要求不极端

---

## 三、主流向量数据库对比

### 3.1 完整对比表

| 特性 | Chroma | Milvus | Qdrant | Pinecone | Weaviate | FAISS |
|------|--------|--------|--------|----------|----------|-------|
| **类型** | 嵌入式 | 分布式 | 分布式 | 托管服务 | 分布式 | 库 |
| **开源** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **索引** | HNSW | HNSW/IVF | HNSW | 专有 | HNSW | 多种 |
| **规模** | 百万级 | 十亿级 | 十亿级 | 十亿级 | 十亿级 | 十亿级 |
| **语言** | Python | 多语言 | 多语言 | API | 多语言 | C++/Python |
| **运维** | 免运维 | 需运维 | 需运维 | 免运维 | 需运维 | 嵌入式 |
| **过滤** | 基础 | 强大 | 强大 | 中等 | GraphQL | 弱 |
| **适用** | 原型开发 | 生产环境 | 生产环境 | 快速上线 | 复杂查询 | 嵌入应用 |

### 3.2 Chroma：轻量级首选

**特点：**
- Python 原生，API 简单
- 嵌入式部署，无需服务器
- 适合原型开发和小规模应用

**快速开始：**
```python
import chromadb

# 创建客户端（内存模式）
client = chromadb.Client()

# 或持久化模式
client = chromadb.PersistentClient(path="./chroma_db")

# 创建集合
collection = client.create_collection(
    name="my_collection",
    metadata={"hnsw:space": "cosine"}
)

# 添加数据
collection.add(
    embeddings=[[0.1, 0.2, ...], [0.3, 0.4, ...]],
    documents=["文档 1", "文档 2"],
    ids=["id1", "id2"],
    metadatas=[{"category": "A"}, {"category": "B"}]
)

# 查询
results = collection.query(
    query_embeddings=[[0.15, 0.25, ...]],
    n_results=5,
    where={"category": "A"}  # 过滤
)
```

**优缺点：**
| 优点 | 缺点 |
|------|------|
| 安装简单，`pip install` 即可 | 只适合单机，无法分布式 |
| API 简洁，学习成本低 | 大规模性能有限 |
| 支持持久化 | 过滤功能较基础 |

### 3.3 Milvus：生产级选择

**架构：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Milvus 架构                                   │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │   SDK    │───▶│  Proxy   │───▶│  Query   │                  │
│  │ (客户端)  │    │ (代理层)  │    │  Coord   │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                       │                 │                        │
│                       ▼                 ▼                        │
│                ┌──────────┐    ┌──────────┐                     │
│                │  Data    │    │  Index   │                     │
│                │  Coord   │    │  Coord   │                     │
│                └──────────┘    └──────────┘                     │
│                       │                 │                        │
│                       ▼                 ▼                        │
│  ┌──────────────────────────────────────────────────┐           │
│  │              Data Nodes (存储 + 计算)             │           │
│  │  ┌────────┐  ┌────────┐  ┌────────┐             │           │
│  │  │ Segment│  │ Segment│  │ Segment│             │           │
│  │  └────────┘  └────────┘  └────────┘             │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                 │
│  依赖组件：                                                      │
│  • etcd：元数据存储                                              │
│  • MinIO/S3：对象存储                                            │
│  • Pulsar/Kafka：消息队列                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**部署方式：**
```bash
# Docker Compose 部署（推荐）
wget https://github.com/milvus-io/milvus/releases/download/v2.3.0/milvus-standalone-docker-compose.yml
docker-compose up -d

# 连接
from pymilvus import connections
connections.connect("default", host="localhost", port="19530")
```

**完整使用示例：**
```python
from pymilvus import (
    connections, FieldSchema, CollectionSchema, 
    DataType, Collection, utility
)

# 1. 连接
connections.connect("default", host="localhost", port="19530")

# 2. 定义 Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="timestamp", dtype=DataType.INT64)
]
schema = CollectionSchema(fields, "文档集合")

# 3. 创建集合
collection = Collection("documents", schema)

# 4. 创建索引
index_params = {
    "index_type": "HNSW",
    "metric_type": "COSINE",
    "params": {"M": 32, "efConstruction": 200}
}
collection.create_index("embedding", index_params)

# 5. 加载到内存
collection.load()

# 6. 插入数据
import numpy as np
data = [
    list(range(1000)),  # ids
    np.random.rand(1000, 1536).tolist(),  # embeddings
    [f"文档{i}" for i in range(1000)],  # texts
    ["cat1"] * 500 + ["cat2"] * 500,  # categories
    [1709712000] * 1000  # timestamps
]
collection.insert(data)

# 7. 搜索
search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 100}
}

results = collection.search(
    data=[np.random.rand(1536).tolist()],  # 查询向量
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr="category == 'cat1' and timestamp > 1709625600"  # 过滤
)

# 8. 处理结果
for hit in results[0]:
    print(f"ID: {hit.id}, 分数：{1-hit.distance}")
```

### 3.4 Qdrant：过滤能力强

**特点：**
- 强大的过滤查询能力
- RESTful API + gRPC
- 支持 Payload（元数据）索引

**使用示例：**
```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition,
    MatchValue, Range
)

# 连接
client = QdrantClient(host="localhost", port=6333)

# 创建集合
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
)

# 创建 Payload 索引（加速过滤）
client.create_payload_index(
    collection_name="documents",
    field_name="category",
    field_schema="keyword"
)

# 插入数据
points = [
    PointStruct(
        id=1,
        vector=[0.1] * 1536,
        payload={"text": "文档 1", "category": "tech", "views": 1000}
    ),
    PointStruct(
        id=2,
        vector=[0.2] * 1536,
        payload={"text": "文档 2", "category": "life", "views": 500}
    )
]
client.upsert(collection_name="documents", points=points)

# 复杂过滤查询
results = client.search(
    collection_name="documents",
    query_vector=[0.15] * 1536,
    query_filter=Filter(
        must=[
            FieldCondition(key="category", match=MatchValue(value="tech")),
            FieldCondition(key="views", range=Range(gte=800))
        ]
    ),
    limit=10
)
```

### 3.5 Pinecone：托管服务

**特点：**
- 完全托管，免运维
- 自动扩展
- 按使用量付费

**使用示例：**
```python
import pinecone

# 初始化
pinecone.init(api_key="your-api-key", environment="us-west1-gcp")

# 创建索引
pinecone.create_index(
    name="my-index",
    dimension=1536,
    metric="cosine",
    pods=1,
    replicas=1,
    pod_type="p1.x1"
)

# 连接索引
index = pinecone.Index("my-index")

# 插入数据
index.upsert([
    ("id1", [0.1] * 1536, {"text": "文档 1", "category": "tech"}),
    ("id2", [0.2] * 1536, {"text": "文档 2", "category": "life"})
])

# 查询
results = index.query(
    vector=[0.15] * 1536,
    filter={"category": "tech"},
    top_k=10,
    include_metadata=True
)
```

---

## 四、生产环境部署

### 4.1 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                  生产环境部署架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │   Nginx  │───▶│   App    │───▶│  Milvus  │                  │
│  │ (负载均衡)│    │ (应用层)  │    │ (向量库)  │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│                                          │                       │
│                                          ▼                       │
│                                   ┌──────────┐                  │
│                                   │  MinIO   │                  │
│                                   │ (对象存储)│                  │
│                                   └──────────┘                  │
│                                                                 │
│  配置建议：                                                      │
│  • Nginx：2 核 4G × 2（主备）                                    │
│  • App：4 核 8G × N（根据 QPS）                                  │
│  • Milvus：8 核 32G × 3（集群）                                  │
│  • MinIO：4 核 16G × 4（分布式）                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 性能优化

**索引优化：**
```python
# Milvus 索引参数调优
index_params = {
    "index_type": "HNSW",
    "metric_type": "COSINE",
    "params": {
        "M": 32,              # 根据内存调整，16-64
        "efConstruction": 200  # 构建质量，100-400
    }
}

# 搜索参数调优
search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 100}  # 搜索精度，50-200
}
```

**内存优化：**
```python
# 1. 使用 PQ 压缩
index_params = {
    "index_type": "IVF_PQ",
    "params": {
        "nlist": 1024,    # 聚类中心
        "m": 16,          # 分段数
        "nbits": 8        # 每段位数
    }
}

# 2. 分区加载
collection.load(partition_names=["partition_2024_q1"])

# 3. 定期释放
utility.release_collection("old_collection")
```

**查询优化：**
```python
# 1. 先过滤再搜索（利用 Payload 索引）
results = collection.search(
    data=[query_vector],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr="category == 'tech' and timestamp > 1709625600"  # 过滤条件
)

# 2. 批量查询
batch_results = collection.search(
    data=query_vectors,  # 多个查询向量
    ...
)

# 3. 缓存热点查询
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_search(query_vector_tuple):
    return collection.search(...)
```

### 4.3 监控与告警

**关键指标：**
| 指标 | 阈值 | 说明 |
|------|------|------|
| **查询延迟 P99** | <100ms | 用户体验关键 |
| **查询 QPS** | 监控趋势 | 容量规划依据 |
| **内存使用率** | <80% | 避免 OOM |
| **磁盘使用率** | <70% | 预留扩展空间 |
| **索引构建进度** | 100% | 确保索引完成 |

**Prometheus 监控配置：**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'milvus'
    static_configs:
      - targets: ['milvus:9091']
  
  - job_name: 'qdrant'
    static_configs:
      - targets: ['qdrant:6333']
```

**告警规则：**
```yaml
# alert_rules.yml
groups:
  - name: vector_db_alerts
    rules:
      - alert: HighQueryLatency
        expr: histogram_quantile(0.99, query_latency) > 0.1
        for: 5m
        annotations:
          summary: "查询延迟过高"
      
      - alert: HighMemoryUsage
        expr: memory_usage / memory_total > 0.8
        for: 10m
        annotations:
          summary: "内存使用率过高"
```

---

## 五、实战案例

### 5.1 案例 1：知识库检索系统

```python
class KnowledgeBaseSearch:
    """知识库检索系统"""
    
    def __init__(self):
        # 初始化向量数据库
        self.client = QdrantClient(host="localhost", port=6333)
        self.embedding_model = FlagModel('BAAI/bge-large-zh-v1.5')
        
        # 创建集合
        self._create_collection()
    
    def _create_collection(self):
        """创建集合"""
        self.client.create_collection(
            collection_name="knowledge_base",
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
        
        # 创建 Payload 索引
        for field in ["category", "department", "update_time"]:
            self.client.create_payload_index(
                collection_name="knowledge_base",
                field_name=field,
                field_schema="keyword"
            )
    
    def index_document(self, doc_id: str, text: str, metadata: dict):
        """索引文档"""
        # 切片（长文档分多段）
        chunks = self._chunk_text(text)
        
        points = []
        for i, chunk in enumerate(chunks):
            # 生成向量
            embedding = self.embedding_model.encode(chunk)
            
            points.append(PointStruct(
                id=f"{doc_id}_chunk_{i}",
                vector=embedding.tolist(),
                payload={
                    "text": chunk,
                    "doc_id": doc_id,
                    **metadata
                }
            ))
        
        # 批量插入
        self.client.upsert("knowledge_base", points)
    
    def search(self, query: str, filters: dict = None, top_k: int = 5) -> list:
        """搜索"""
        # 生成查询向量
        query_embedding = self.embedding_model.encode(query)
        
        # 构建过滤条件
        query_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
            query_filter = Filter(must=conditions)
        
        # 搜索
        results = self.client.search(
            collection_name="knowledge_base",
            query_vector=query_embedding.tolist(),
            query_filter=query_filter,
            limit=top_k
        )
        
        # 格式化结果
        return [
            {
                "text": hit.payload["text"],
                "score": 1 - hit.score,
                "metadata": {k: v for k, v in hit.payload.items() if k != "text"}
            }
            for hit in results
        ]
    
    def _chunk_text(self, text: str, chunk_size: int = 500) -> list:
        """文本切片"""
        # 实现切片逻辑
        pass
```

### 5.2 案例 2：推荐系统

```python
class VectorBasedRecommender:
    """基于向量的推荐系统"""
    
    def __init__(self):
        self.client = MilvusClient("localhost:19530")
        self.embedding_model = load_model()
    
    def recommend(self, user_id: str, top_k: int = 10) -> list:
        """为用户推荐内容"""
        # 1. 获取用户向量
        user_vector = self._get_user_vector(user_id)
        
        # 2. 搜索相似内容
        results = self.client.search(
            collection_name="items",
            data=[user_vector],
            anns_field="embedding",
            limit=top_k,
            expr=f"is_available == true"  # 只推荐可用的
        )
        
        # 3. 过滤已看过的
        viewed = self._get_user_viewed(user_id)
        recommendations = [
            item for item in results
            if item["id"] not in viewed
        ]
        
        return recommendations[:top_k]
    
    def similar_items(self, item_id: str, top_k: int = 5) -> list:
        """查找相似物品"""
        # 获取物品向量
        item_vector = self._get_item_vector(item_id)
        
        # 搜索
        results = self.client.search(
            collection_name="items",
            data=[item_vector],
            anns_field="embedding",
            limit=top_k + 1  # +1 排除自己
        )
        
        # 排除自己
        return [r for r in results if r["id"] != item_id][:top_k]
```

---

## 🎯 面试回答版本

> 面试官问："你了解向量数据库吗？有哪些使用经验？"

### 标准回答（2-3 分钟）

```
向量数据库是专门存储和检索向量数据的数据库，
是 AI 应用的核心基础设施。

【核心原理】
传统数据库做关键词匹配，向量数据库做语义相似度搜索。
用 ANN（近似最近邻）索引将 O(n) 搜索优化到 O(log n)，
100 万向量搜索从 1 秒降到 10 毫秒。

【索引技术】
主流索引有 HNSW（高精度）、IVF（大规模）、PQ（压缩）。
HNSW 用多层图结构，召回率 95-99%；
IVF 用聚类 + 倒排，适合十亿级规模。

【产品选型】
原型开发用 Chroma，简单快速；
生产环境用 Milvus 或 Qdrant，支持分布式；
免运维用 Pinecone 托管服务。

【实战经验】
我在 RAG 项目中用 Milvus 存储了 100 万文档向量，
通过 HNSW 索引 + Payload 过滤，
查询延迟 P99 < 50ms，准确率 95%+。

【优化技巧】
索引参数调优（M、efConstruction）、
PQ 压缩节省内存、Payload 索引加速过滤、
批量查询提升吞吐。
```

### 高频追问

| 追问 | 参考回答 |
|------|---------|
| "HNSW 和 IVF 怎么选？" | 内存充足、追求精度用 HNSW；超大规模、成本敏感用 IVF。 |
| "如何保证高可用？" | Milvus 集群部署、多副本、定期备份、监控告警。 |
| "向量数据库和 Elasticsearch 有什么区别？" | ES 做关键词搜索，向量库做语义搜索。可以混合使用。 |
| "如何处理实时更新？" | 向量库支持实时插入删除，但频繁更新建议用批量方式。 |

---

**相关阅读：**
- [Embedding 详解](./ai-embedding-vector-search.md) - 理解向量化原理
- [RAG 技术详解](./ai-rag-deep-dive.md) - 学习检索增强生成
- [AI Agent 技能](./ai-agent-skill-intro.md) - 了解技能实现
