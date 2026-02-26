/**
 * mappings.ts
 * Symbol -> header mappings for C and C++.
 *
 * To extend: add entries to CPP_MAPPINGS or C_MAPPINGS.
 * Format: "symbol": "header"  (no angle brackets or quotes)
 */

export const CPP_MAPPINGS: Record<string, string> = {

  // I/O

  cout:              "iostream",
  cin:               "iostream",
  cerr:              "iostream",
  clog:              "iostream",
  endl:              "iostream",
  ostream:           "ostream",
  istream:           "istream",
  ifstream:          "fstream",
  ofstream:          "fstream",
  fstream:           "fstream",
  stringstream:      "sstream",
  istringstream:     "sstream",
  ostringstream:     "sstream",
  printf:            "cstdio",
  scanf:             "cstdio",
  fprintf:           "cstdio",
  fscanf:            "cstdio",
  fopen:             "cstdio",
  fclose:            "cstdio",
  fread:             "cstdio",
  fwrite:            "cstdio",
  fgets:             "cstdio",
  fputs:             "cstdio",
  puts:              "cstdio",
  gets:              "cstdio",
  perror:            "cstdio",
  FILE:              "cstdio",
  EOF:               "cstdio",
  stdin:             "cstdio",
  stdout:            "cstdio",
  stderr:            "cstdio",

  // Containers

  vector:            "vector",
  list:              "list",
  deque:             "deque",
  queue:             "queue",
  priority_queue:    "queue",
  stack:             "stack",
  map:               "map",
  multimap:          "map",
  set:               "set",
  multiset:          "set",
  unordered_map:     "unordered_map",
  unordered_multimap:"unordered_map",
  unordered_set:     "unordered_set",
  unordered_multiset:"unordered_set",
  array:             "array",
  bitset:            "bitset",
  forward_list:      "forward_list",
  span:              "span",

  // String

  string:            "string",
  wstring:           "string",
  string_view:       "string_view",
  wstring_view:      "string_view",

  // Algorithms

  sort:              "algorithm",
  stable_sort:       "algorithm",
  find:              "algorithm",
  find_if:           "algorithm",
  count:             "algorithm",
  count_if:          "algorithm",
  copy:              "algorithm",
  copy_if:           "algorithm",
  transform:         "algorithm",
  for_each:          "algorithm",
  fill:              "algorithm",
  fill_n:            "algorithm",
  replace:           "algorithm",
  remove:            "algorithm",
  unique:            "algorithm",
  reverse:           "algorithm",
  rotate:            "algorithm",
  shuffle:           "algorithm",
  binary_search:     "algorithm",
  lower_bound:       "algorithm",
  upper_bound:       "algorithm",
  equal_range:       "algorithm",
  merge:             "algorithm",
  min:               "algorithm",
  max:               "algorithm",
  min_element:       "algorithm",
  max_element:       "algorithm",
  clamp:             "algorithm",

  // Numeric

  accumulate:        "numeric",
  reduce:            "numeric",
  inner_product:     "numeric",
  iota:              "numeric",
  partial_sum:       "numeric",

  // Utility

  swap:              "utility",
  exchange:          "utility",
  move:              "utility",
  forward:           "utility",
  pair:              "utility",

  // Memory

  unique_ptr:        "memory",
  shared_ptr:        "memory",
  weak_ptr:          "memory",
  make_unique:       "memory",
  make_shared:       "memory",
  allocator:         "memory",

  // Tuple / Optional / Variant

  tuple:             "tuple",
  get:               "tuple",
  make_tuple:        "tuple",
  tie:               "tuple",
  apply:             "tuple",
  optional:          "optional",
  variant:           "variant",
  any:               "any",
  expected:          "expected",

  // Type traits

  is_same:           "type_traits",
  is_integral:       "type_traits",
  enable_if:         "type_traits",
  conditional:       "type_traits",
  decay:             "type_traits",
  remove_reference:  "type_traits",
  add_pointer:       "type_traits",

  // Functional

  function:          "functional",
  bind:              "functional",
  invoke:            "functional",
  hash:              "functional",
  less:              "functional",
  greater:           "functional",

  // Math

  abs:               "cmath",
  fabs:              "cmath",
  sqrt:              "cmath",
  cbrt:              "cmath",
  pow:               "cmath",
  exp:               "cmath",
  log:               "cmath",
  log2:              "cmath",
  log10:             "cmath",
  sin:               "cmath",
  cos:               "cmath",
  tan:               "cmath",
  asin:              "cmath",
  acos:              "cmath",
  atan:              "cmath",
  atan2:             "cmath",
  ceil:              "cmath",
  floor:             "cmath",
  round:             "cmath",
  trunc:             "cmath",
  fmod:              "cmath",
  hypot:             "cmath",
  isnan:             "cmath",
  isinf:             "cmath",
  M_PI:              "cmath",

  // C stdlib

  malloc:            "cstdlib",
  calloc:            "cstdlib",
  realloc:           "cstdlib",
  free:              "cstdlib",
  exit:              "cstdlib",
  abort:             "cstdlib",
  atoi:              "cstdlib",
  atof:              "cstdlib",
  atol:              "cstdlib",
  strtol:            "cstdlib",
  strtod:            "cstdlib",
  rand:              "cstdlib",
  srand:             "cstdlib",

  // C string

  strlen:            "cstring",
  strcpy:            "cstring",
  strncpy:           "cstring",
  strcat:            "cstring",
  strncat:           "cstring",
  strcmp:            "cstring",
  strncmp:           "cstring",
  strchr:            "cstring",
  strstr:            "cstring",
  memcpy:            "cstring",
  memmove:           "cstring",
  memset:            "cstring",
  memcmp:            "cstring",

  // Concurrency

  thread:            "thread",
  mutex:             "mutex",
  lock_guard:        "mutex",
  unique_lock:       "mutex",
  shared_mutex:      "shared_mutex",
  condition_variable:"condition_variable",
  future:            "future",
  promise:           "future",
  async:             "future",
  atomic:            "atomic",

  // Random

  mt19937:           "random",
  mt19937_64:        "random",
  random_device:     "random",
  uniform_int_distribution:  "random",
  uniform_real_distribution: "random",
  normal_distribution:       "random",

  // Chrono

  chrono:            "chrono",
  duration:          "chrono",
  time_point:        "chrono",
  steady_clock:      "chrono",
  system_clock:      "chrono",

  // Exceptions

  exception:         "exception",
  runtime_error:     "stdexcept",
  logic_error:       "stdexcept",
  out_of_range:      "stdexcept",
  invalid_argument:  "stdexcept",
  overflow_error:    "stdexcept",
  underflow_error:   "stdexcept",

  // Filesystem

  filesystem:        "filesystem",
  path:              "filesystem",
  directory_iterator:"filesystem",

  // Ranges

  ranges:            "ranges",

  // Limits

  numeric_limits:    "limits",
  INT_MAX:           "climits",
  INT_MIN:           "climits",
  UINT_MAX:          "climits",
  LLONG_MAX:         "climits",
  DBL_MAX:           "cfloat",
  FLT_MAX:           "cfloat",

  // Fixed-width integers

  int8_t:            "cstdint",
  int16_t:           "cstdint",
  int32_t:           "cstdint",
  int64_t:           "cstdint",
  uint8_t:           "cstdint",
  uint16_t:          "cstdint",
  uint32_t:          "cstdint",
  uint64_t:          "cstdint",
  intptr_t:          "cstdint",
  uintptr_t:         "cstdint",
  SIZE_MAX:          "cstdint",
  ptrdiff_t:         "cstddef",
  size_t:            "cstddef",
  nullptr_t:         "cstddef",

  // I/O manipulators

  setprecision:      "iomanip",
  setw:              "iomanip",
  setfill:           "iomanip",
  fixed:             "iomanip",
  scientific:        "iomanip",
  hex:               "iomanip",
  dec:               "iomanip",
  oct:               "iomanip",
  locale:            "locale",
  format:            "format",

  // Assert

  assert:            "cassert",

  // Signal

  signal:            "csignal",
  raise:             "csignal",
  SIGINT:            "csignal",

};


export const C_MAPPINGS: Record<string, string> = {

  // I/O

  printf:    "stdio.h",
  scanf:     "stdio.h",
  fprintf:   "stdio.h",
  fscanf:    "stdio.h",
  sprintf:   "stdio.h",
  sscanf:    "stdio.h",
  snprintf:  "stdio.h",
  fopen:     "stdio.h",
  fclose:    "stdio.h",
  fread:     "stdio.h",
  fwrite:    "stdio.h",
  fgets:     "stdio.h",
  fputs:     "stdio.h",
  puts:      "stdio.h",
  gets:      "stdio.h",
  getchar:   "stdio.h",
  putchar:   "stdio.h",
  fflush:    "stdio.h",
  fseek:     "stdio.h",
  ftell:     "stdio.h",
  rewind:    "stdio.h",
  feof:      "stdio.h",
  ferror:    "stdio.h",
  perror:    "stdio.h",
  remove:    "stdio.h",
  rename:    "stdio.h",
  FILE:      "stdio.h",
  EOF:       "stdio.h",
  stdin:     "stdio.h",
  stdout:    "stdio.h",
  stderr:    "stdio.h",

  // Memory / stdlib

  malloc:    "stdlib.h",
  calloc:    "stdlib.h",
  realloc:   "stdlib.h",
  free:      "stdlib.h",
  exit:      "stdlib.h",
  abort:     "stdlib.h",
  atexit:    "stdlib.h",
  atoi:      "stdlib.h",
  atof:      "stdlib.h",
  atol:      "stdlib.h",
  strtol:    "stdlib.h",
  strtod:    "stdlib.h",
  rand:      "stdlib.h",
  srand:     "stdlib.h",
  abs:       "stdlib.h",
  div:       "stdlib.h",

  // String

  strlen:    "string.h",
  strcpy:    "string.h",
  strncpy:   "string.h",
  strcat:    "string.h",
  strncat:   "string.h",
  strcmp:    "string.h",
  strncmp:   "string.h",
  strchr:    "string.h",
  strrchr:   "string.h",
  strstr:    "string.h",
  strtok:    "string.h",
  memcpy:    "string.h",
  memmove:   "string.h",
  memset:    "string.h",
  memcmp:    "string.h",
  memchr:    "string.h",

  // Math

  fabs:      "math.h",
  sqrt:      "math.h",
  cbrt:      "math.h",
  pow:       "math.h",
  exp:       "math.h",
  log:       "math.h",
  log2:      "math.h",
  log10:     "math.h",
  sin:       "math.h",
  cos:       "math.h",
  tan:       "math.h",
  asin:      "math.h",
  acos:      "math.h",
  atan:      "math.h",
  atan2:     "math.h",
  ceil:      "math.h",
  floor:     "math.h",
  round:     "math.h",
  fmod:      "math.h",
  hypot:     "math.h",
  M_PI:      "math.h",

  // Char

  isalpha:   "ctype.h",
  isdigit:   "ctype.h",
  isalnum:   "ctype.h",
  isspace:   "ctype.h",
  isupper:   "ctype.h",
  islower:   "ctype.h",
  toupper:   "ctype.h",
  tolower:   "ctype.h",
  isprint:   "ctype.h",
  ispunct:   "ctype.h",

  // Fixed-width integers

  int8_t:    "stdint.h",
  int16_t:   "stdint.h",
  int32_t:   "stdint.h",
  int64_t:   "stdint.h",
  uint8_t:   "stdint.h",
  uint16_t:  "stdint.h",
  uint32_t:  "stdint.h",
  uint64_t:  "stdint.h",
  intptr_t:  "stdint.h",
  uintptr_t: "stdint.h",
  size_t:    "stddef.h",
  ptrdiff_t: "stddef.h",
  NULL:      "stddef.h",

  // Boolean

  bool:      "stdbool.h",
  true:      "stdbool.h",
  false:     "stdbool.h",

  // Limits

  INT_MAX:   "limits.h",
  INT_MIN:   "limits.h",
  UINT_MAX:  "limits.h",
  LONG_MAX:  "limits.h",
  LLONG_MAX: "limits.h",
  DBL_MAX:   "float.h",
  FLT_MAX:   "float.h",

  // Assert

  assert:    "assert.h",

  // Time

  time:      "time.h",
  clock:     "time.h",
  difftime:  "time.h",
  mktime:    "time.h",
  localtime: "time.h",
  gmtime:    "time.h",
  strftime:  "time.h",
  time_t:    "time.h",

  // Signal

  signal:    "signal.h",
  raise:     "signal.h",
  SIGINT:    "signal.h",
  SIGSEGV:   "signal.h",

  // Error

  errno:     "errno.h",
  EINVAL:    "errno.h",
  ENOMEM:    "errno.h",

  // setjmp

  setjmp:    "setjmp.h",
  longjmp:   "setjmp.h",

};

export function lookupHeader(symbol: string, isCpp: boolean): string | undefined {
  if (isCpp) {
    return CPP_MAPPINGS[symbol] ?? C_MAPPINGS[symbol];
  }
  return C_MAPPINGS[symbol];
}