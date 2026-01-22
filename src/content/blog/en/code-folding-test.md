---
title: "Code Folding Feature Test Article"
date: 2024-01-20
tags: [Test, Code, Feature]
summary: "This is a test article for the code folding feature, containing multiple code blocks of different lengths to verify that the folding functionality works correctly."
lang: "en"
draft: false
priority: 0
---

This is a test article to verify that the code folding feature works correctly.

## Short Code Block (Should Not Fold)

This is a code block with less than 30 lines, which should not be folded:

```javascript
// This is a short code example
function greet(name) {
  return `Hello, ${name}!`;
}

const user = "World";
console.log(greet(user));
```

## Long Code Block (Should Fold)

Below is a code block with more than 30 lines, which should be folded by default, showing only the first 20 lines:

```typescript
// This is a long TypeScript code example
// Used to test the code folding feature
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
    // Initialize some sample user data
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

// Usage example
const userService = new UserService();
const user = userService.getUserById(1);
console.log(user);

const youngUsers = userService.filterUsersByAge(20, 30);
console.log('Young users:', youngUsers);

const searchResults = userService.searchUsers('alice');
console.log('Search results:', searchResults);
```

## Python Code Example (Long Code Block)

Below is a Python code example, also with more than 30 lines:

```python
# This is a Python data processing example
# Used to test the code folding feature

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
        """Load product data from file"""
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
        """Save product data to file"""
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
        """Add a new product"""
        if any(p.id == product.id for p in self.products):
            raise ValueError(f"Product with id {product.id} already exists")
        self.products.append(product)
        self.save_products()
    
    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID"""
        return next((p for p in self.products if p.id == product_id), None)
    
    def get_products_by_category(self, category: str) -> List[Product]:
        """Get products by category"""
        return [p for p in self.products if p.category == category]
    
    def update_stock(self, product_id: int, quantity: int):
        """Update stock"""
        product = self.get_product_by_id(product_id)
        if not product:
            raise ValueError(f"Product with id {product_id} not found")
        product.stock += quantity
        if product.stock < 0:
            product.stock = 0
        self.save_products()
    
    def export_to_csv(self, filename: str):
        """Export product data to CSV"""
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
        """Get products with stock below threshold"""
        return [p for p in self.products if p.stock < threshold]
    
    def calculate_total_value(self) -> float:
        """Calculate total value of all products"""
        return sum(p.price * p.stock for p in self.products)

# Usage example
if __name__ == '__main__':
    manager = ProductManager()
    
    # Add some sample products
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
    
    # Query operations
    laptop = manager.get_product_by_id(1)
    print(f"Found product: {laptop.name}")
    
    electronics = manager.get_products_by_category('Electronics')
    print(f"Found {len(electronics)} electronics products")
    
    low_stock = manager.get_low_stock_products(20)
    print(f"Products with low stock: {[p.name for p in low_stock]}")
    
    total_value = manager.calculate_total_value()
    print(f"Total inventory value: ${total_value:.2f}")
```

## Summary

This article contains:
1. A short code block (less than 30 lines) - should not be folded
2. A TypeScript long code block (more than 30 lines) - should be folded
3. A Python long code block (more than 30 lines) - should be folded

Please check:
- Whether long code blocks show only the first 20 lines by default
- Whether the "Expand" button is displayed
- Whether clicking expand shows all code
- Whether clicking collapse restores the default state
- Whether the gradient fade effect displays correctly
