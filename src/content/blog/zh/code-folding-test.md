---
title: "代码折叠功能测试文章"
date: 2024-01-20
tags: [测试, 代码, 功能]
summary: "这是一篇用于测试代码折叠功能的文章，包含多个不同长度的代码块，用于验证折叠功能是否正常工作。"
lang: "zh"
draft: false
priority: 0
---

这是一篇测试文章，用于验证代码折叠功能是否正常工作。

## 短代码块（应该不折叠）

这是一个少于30行的代码块，应该不会被折叠：

```javascript
// 这是一个简短的代码示例
function greet(name) {
  return `Hello, ${name}!`;
}

const user = "World";
console.log(greet(user));
```

## 长代码块（应该被折叠）

下面是一个超过30行的代码块，应该默认折叠，只显示前20行：

```typescript
// 这是一个很长的 TypeScript 代码示例
// 用于测试代码折叠功能
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  address: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

class UserService {
  private users: User[] = [];

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers(): void {
    // 初始化一些示例用户数据
    this.users = [
      {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        age: 28,
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
          zipCode: '10001'
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true
        }
      },
      {
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        age: 32,
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          country: 'USA',
          zipCode: '90001'
        },
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: false
        }
      }
    ];
  }

  public getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  public getAllUsers(): User[] {
    return [...this.users];
  }

  public addUser(user: User): void {
    if (this.users.find(u => u.id === user.id)) {
      throw new Error(`User with id ${user.id} already exists`);
    }
    this.users.push(user);
  }

  public updateUser(id: number, updates: Partial<User>): void {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
  }

  public deleteUser(id: number): void {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    this.users.splice(userIndex, 1);
  }

  public filterUsersByAge(minAge: number, maxAge: number): User[] {
    return this.users.filter(user => user.age >= minAge && user.age <= maxAge);
  }

  public searchUsers(query: string): User[] {
    const lowerQuery = query.toLowerCase();
    return this.users.filter(user =>
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }
}

// 使用示例
const userService = new UserService();
const user = userService.getUserById(1);
console.log(user);

const youngUsers = userService.filterUsersByAge(20, 30);
console.log('Young users:', youngUsers);

const searchResults = userService.searchUsers('alice');
console.log('Search results:', searchResults);
```

## Python 代码示例（长代码块）

下面是一个 Python 代码示例，也超过30行：

```python
# 这是一个 Python 数据处理示例
# 用于测试代码折叠功能

import json
import csv
from typing import List, Dict, Optional
from datetime import datetime
from dataclasses import dataclass

@dataclass
class Product:
    id: int
    name: str
    price: float
    category: str
    stock: int
    created_at: datetime

class ProductManager:
    def __init__(self):
        self.products: List[Product] = []
        self.load_products()
    
    def load_products(self):
        """从文件加载产品数据"""
        try:
            with open('products.json', 'r') as f:
                data = json.load(f)
                self.products = [
                    Product(
                        id=p['id'],
                        name=p['name'],
                        price=p['price'],
                        category=p['category'],
                        stock=p['stock'],
                        created_at=datetime.fromisoformat(p['created_at'])
                    )
                    for p in data
                ]
        except FileNotFoundError:
            print("Products file not found, starting with empty list")
    
    def save_products(self):
        """保存产品数据到文件"""
        data = [
            {
                'id': p.id,
                'name': p.name,
                'price': p.price,
                'category': p.category,
                'stock': p.stock,
                'created_at': p.created_at.isoformat()
            }
            for p in self.products
        ]
        with open('products.json', 'w') as f:
            json.dump(data, f, indent=2)
    
    def add_product(self, product: Product):
        """添加新产品"""
        if any(p.id == product.id for p in self.products):
            raise ValueError(f"Product with id {product.id} already exists")
        self.products.append(product)
        self.save_products()
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """根据ID获取产品"""
        return next((p for p in self.products if p.id == product_id), None)
    
    def get_products_by_category(self, category: str) -> List[Product]:
        """根据类别获取产品"""
        return [p for p in self.products if p.category == category]
    
    def update_stock(self, product_id: int, quantity: int):
        """更新库存"""
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product with id {product_id} not found")
        product.stock += quantity
        if product.stock < 0:
            product.stock = 0
        self.save_products()
    
    def export_to_csv(self, filename: str):
        """导出产品数据到CSV"""
        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['ID', 'Name', 'Price', 'Category', 'Stock', 'Created At'])
            for p in self.products:
                writer.writerow([
                    p.id,
                    p.name,
                    p.price,
                    p.category,
                    p.stock,
                    p.created_at.isoformat()
                ])
    
    def get_low_stock_products(self, threshold: int = 10) -> List[Product]:
        """获取库存低于阈值的产品"""
        return [p for p in self.products if p.stock < threshold]
    
    def calculate_total_value(self) -> float:
        """计算所有产品的总价值"""
        return sum(p.price * p.stock for p in self.products)

# 使用示例
if __name__ == '__main__':
    manager = ProductManager()
    
    # 添加一些示例产品
    manager.add_product(Product(
        id=1,
        name='Laptop',
        price=999.99,
        category='Electronics',
        stock=15,
        created_at=datetime.now()
    ))
    
    manager.add_product(Product(
        id=2,
        name='Mouse',
        price=29.99,
        category='Electronics',
        stock=50,
        created_at=datetime.now()
    ))
    
    # 查询操作
    laptop = manager.get_product_by_id(1)
    print(f"Found product: {laptop.name}")
    
    electronics = manager.get_products_by_category('Electronics')
    print(f"Found {len(electronics)} electronics products")
    
    low_stock = manager.get_low_stock_products(20)
    print(f"Products with low stock: {[p.name for p in low_stock]}")
    
    total_value = manager.calculate_total_value()
    print(f"Total inventory value: ${total_value:.2f}")
```

## 总结

这篇文章包含了：
1. 一个短代码块（少于30行）- 不应该被折叠
2. 一个 TypeScript 长代码块（超过30行）- 应该被折叠
3. 一个 Python 长代码块（超过30行）- 应该被折叠

请检查：
- 长代码块是否默认只显示前20行
- 是否显示"展开"按钮
- 点击展开后是否显示全部代码
- 点击折叠后是否恢复默认状态
- 渐变遮罩效果是否正常显示
