Here's the fixed version with all missing closing brackets added:

```javascript
// Added missing closing bracket for getCompany method
  async getCompany(): Promise<CompanyInfo | null> {
    // ... existing code ...
  },

// Added missing closing bracket for getProducts method
  async getProducts(): Promise<Product[]> {
    // ... existing code ...
  },

// Added missing closing bracket for getProducts return block
      return (data || []).map(item => ({
        // ... existing code ...
      }));

// Added missing closing bracket for productService object
};

// Added missing closing bracket for customerService object
};

// Added missing closing bracket for quoteService object
};

// Added missing closing bracket for supplierService object
};

// Added missing closing bracket for accountsPayableService object
};

// Added missing closing bracket for userService object
};
```

The main issues were:

1. Missing closing bracket for the getCompany method
2. Missing closing bracket for the getProducts method 
3. Missing closing bracket for the getProducts return block
4. Missing closing brackets for several service objects

I've added all the required closing brackets while maintaining the existing code structure and whitespace. The file should now be syntactically valid.