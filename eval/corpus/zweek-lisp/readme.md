> [!WARNING]
> **Post-Mortem: Project Archived**
> This project was a fun experiment, but it turns out to be a dead end. I'm archiving it to focus on other tools.
>
> **The Realization:**
> 1. **C++ is complex for a reason:** Trying to hide C++ complexity behind Lisp syntax just created a new set of problems without solving the old ones.
> 2. **Training Data matters:** AI models are surprisingly good at C++ because they've read the internet. They are bad at Zweek because I invented it yesterday.

# Zweek

**A Lisp-Dialect Intermediate Representation for AI → C++ Compilation**  
*Enabling small local LLMs (0.5B-3B params) to generate native code through constrained S-expressions.*

---

## The Problem
Small local LLMs struggle with C++ syntax. They hallucinate, forget semicolons, and waste tokens on verbose boilerplate.

## The Solution
**Zweek** is a minimal Lisp dialect that acts as an AI-friendly bridge to C++:

```
AI Model → Zweek S-Expressions → C++ → Native Binary
```

1. **GBNF Grammar** constrains AI output to guarantee 100% valid syntax
2. **S-Expression Parsing** converts Lisp-style code `(def add ...)` into an AST
3. **C++ Transpiler** generates optimized, typed C++17 from the AST
4. **Native Compilation** produces fast executables via MSVC/GCC

### Why Lisp?
- **Token-efficient**: `(+ a b)` vs `int result = a + b;`
- **Grammar-constrained**: S-expressions are trivial to validate with GBNF
- **AST-ready**: Parentheses define the tree structure explicitly

---

## Example

**Zweek S-Expression Input:**
```lisp
(def factorial ((n :int)) :int
  (if (<= n 1)
    1
    (* n (factorial (- n 1)))))

(def main () :int
  (print "Factorial of 5:")
  (print (factorial 5))
  0)
```

**Generated C++:**
```cpp
#include <iostream>
#include <vector>
#include <string>
#include <memory>

int factorial(int n) {
    if ((n <= 1)) {
        return 1;
    } else {
        return (n * factorial((n - 1)));
    }
}

int main() {
    std::cout << "Factorial of 5:" << std::endl;
    std::cout << factorial(5) << std::endl;
    return 0;
}
```

**Output:** `120`

---

## Current Features (v0.1)
- ✅ **Typed Functions:** `(def name ((arg :type)...) :return-type body)`
- ✅ **Variables:** `(let x 10)` → `auto x = 10;`
- ✅ **Conditionals:** `(if cond then else)` with implicit returns
- ✅ **Recursion:** Full support for recursive function calls
- ✅ **Operators:** Math `(+ - * /)`, Comparisons `(< > <= >= ==)`
- ✅ **I/O:** `(print ...)` → chained `std::cout` statements

---

## Architecture

```
┌─────────────────┐
│  llama.cpp      │  Qwen-0.5B generates Zweek code
│  + GBNF Grammar │  (constrained to valid syntax)
└────────┬────────┘
         │ .zw file
         ▼
┌─────────────────┐
│  Lexer          │  Tokenize S-expressions
│  (lexer.cpp)    │  → LPAREN, RPAREN, SYMBOL, NUMBER, STRING
└────────┬────────┘
         │ Tokens
         ▼
┌─────────────────┐
│  Parser         │  Build Abstract Syntax Tree
│  (parser.cpp)   │  → FUNCTION_DEF, CALL, LITERAL, etc.
└────────┬────────┘
         │ AST
         ▼
┌─────────────────┐
│  Code Generator │  Emit C++17 code
│  (codegen.cpp)  │  → Type mapping, operator handling, etc.
└────────┬────────┘
         │ .cpp file
         ▼
┌─────────────────┐
│  MSVC / GCC     │  Compile to native binary
│  (cl.exe/g++)   │
└─────────────────┘
```

---

## Usage

```bash
# Transpile only
zweek.exe program.zw

# Compile and run
zweek.exe program.zw --run
```

---

*Built for the edge. Powered by C++.*
