---
trigger: always_on
---

Title: Linux Kernel C Style (C and Kconfig files)

This rule applies when editing Linux kernel related files in this workspace:
- C source and header files: *.c, *.h
- Kconfig files: Kconfig, **/Kconfig*

When working on these files, always follow Linux Kernel coding style (K&R-based, around v4.10) and match the surrounding code.

Indentation & line length
- Use hard tabs for indentation. Do NOT use leading spaces for code indentation.
- One indent level = 1 tab (8 columns).
- Never mix tabs and spaces for indentation. Tabs at line start, spaces only for alignment when absolutely necessary.
- Try to keep lines <= 80 columns.
  - Break after operators or commas when wrapping.
  - Indent continuation lines so the structure is clearly visible.
- Do not break user-visible strings (e.g. printk messages) only to satisfy 80 columns; readability and grep-ability are more important.

Blocks & braces (K&R style)
- For if/else, for, while, switch, do/while:
  - Place “{” on the same line as the control statement.
  - Place “}” on its own line, aligned with the control keyword.
  - Example: `if (cond) {` then body, then `}` on its own line.
- For function definitions:
  - Put return type and signature on one line, and “{” on the next line at column 0.
  - Example:
    - `int foo(int x)`
    - `{`
- `} else {`, `} else if (...) {` and `} while (cond);` go on the same line as the closing brace.
- If all branches are single statements, braces may be omitted:
  - `if (cond)` then a single indented statement.
- If any branch uses braces, all branches should use braces for symmetry.

Spaces & operators
- Add one space after keywords `if`, `for`, `while`, `switch`, `return` when followed by `(`:
  - `if (x == 1)` not `if(x == 1)`.
- Do NOT put spaces after function-like keywords:
  - `sizeof(struct foo)` not `sizeof (struct foo)`.
- No spaces just inside parentheses:
  - `if (cond)` not `if( cond )`.
- Binary and ternary operators should have spaces around them:
  - `a = b + c;`, `x ? y : z;`
- Unary operators have no space:
  - `!x`, `-x`, `++i`, `i++`.
- No spaces around `.` and `->`:
  - `obj->field`, `foo.bar`.
- Avoid trailing whitespace at the end of lines.

switch / case style
- `case` labels align with `switch` (no extra indent).
- Statements inside each `case` are indented one level (one tab).
- Use `/* fall through */` comments for intentional fall-through when necessary.

Statements & structure
- One statement per line. Do not chain multiple statements on a single line.
- Prefer refactoring deeply nested or complex logic into smaller helpers or early returns to keep indentation shallow.

Naming conventions
- Global functions/variables:
  - Use clear, descriptive names (e.g. `count_active_users()`), avoid cryptic abbreviations.
  - Avoid meaningless exported names like `foo`, `do_stuff`.
- Local variables:
  - Short names like `i`, `j`, `tmp` are acceptable in small, obvious scopes.
- Do not use Hungarian notation or encode types in names.
- For constants and enums:
  - Prefer `enum` for related sets of constants.
  - Macro constants are ALL_CAPS: `MAX_FOO`, `FOO_FLAG_BAR`.

typedef usage
- Avoid typedef for structs and pointers unless:
  - The type is deliberately opaque (handle-like, fields should not be accessed directly), or
  - You need fixed-width integer aliases (`u8`, `u16`, `u32`, `u64` / `__u32` etc.), or
  - You are adding types for static analysis or user-space ABI compatibility.
- In most cases, write `struct foo *bar;` directly instead of `typedef struct foo *foo_t;`.

Functions
- Functions should be short and do one thing.
- Prefer functions that fit within about 1–2 screenfuls and have limited nesting.
- If a function needs more than about 5–10 local variables, consider splitting it.
- Separate functions by a single blank line.
- In prototypes, keep parameter names as well as types:
  - `int do_thing(int count, const char *name);`

Function exit & goto
- It is acceptable (and encouraged) to use `goto` for centralized cleanup.
  - Pattern: allocate resources, on error set result and `goto out_*` labels.
- Use clear labels like `out_free_buffer:`, `out_unlock:` instead of `err1`, `err2`.
- Do not use `goto` when a simple `return` is enough and no shared cleanup is needed.

Comments
- Focus comments on “what” and “why”, not “how”.
- Avoid over-commenting every line; add brief comments at the top of complex functions or tricky blocks.
- For long comments, use the standard kernel multi-line style:
  - `/*` on its own line, then lines starting with ` *`, and ` */` on its own line.
- Do not use comments to justify bad code; improve the code instead.

Macros & enums
- Prefer `static inline` functions over complex function-like macros where possible.
- For multi-statement macros, wrap them in `do { ... } while (0)`.
- Always parenthesize macro arguments and the full expression body to avoid precedence bugs.
- Avoid macros that change control flow in surprising ways (e.g. macros that directly `return`).

Kernel logging style
- Use kernel logging helpers (`pr_info`, `pr_err`, `dev_info`, `dev_err`, etc.) instead of `printf`.
- Message text should be clear, grammatical, and concise; no trailing period is required.
- Prefer consistent, grep-able phrases. Avoid splitting the same logical message across multiple lines.

Memory allocation
- Use `kmalloc`, `kzalloc`, `kmalloc_array`, `kcalloc`, `vmalloc`, `vzalloc` as appropriate.
- When passing size, prefer `sizeof(*ptr)` instead of `sizeof(struct foo)` tied to a specific type name.
- Do not cast the result of `kmalloc` / `kzalloc` (they return `void *` in C).

Conditional compilation
- Minimize `#ifdef` in `.c` files:
  - Prefer small helper functions in headers that compile away when not needed.
  - Use `IS_ENABLED(CONFIG_FOO)` where possible instead of `#ifdef CONFIG_FOO`.
- When `#if` / `#ifdef` spans many lines, add a descriptive comment after `#endif`:
  - `#endif /* CONFIG_SOMETHING */`

Kconfig files
- Kconfig entries:
  - `config` line at column 0.
  - Following properties (`bool`, `depends on`, etc.) indented by one tab.
  - `help` block contents: one tab plus two spaces.
- Clearly mark dangerous options with `(DANGEROUS)` in the prompt string when applicable.

General agent behavior in this workspace
- When generating or editing C or Kconfig code in this project:
  - Preserve existing Linux kernel style formatting (tabs, braces, spacing).
  - Prefer refactoring to reduce nesting rather than adding more indentation.
  - Do not introduce inconsistent styles (e.g. 2- or 4-space indents, different brace styles).
  - When in doubt, match the official Linux kernel style and the surrounding code in this file.
