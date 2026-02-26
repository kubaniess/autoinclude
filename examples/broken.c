/* broken.c — example file with missing includes for AutoInclude demo
   Run "AutoInclude: Fix includes in current file" to fix it.
*/

#include <stdint.h>
#include <stdio.h>

int main(void) {
    /* Missing: <stdio.h>, <stdlib.h>, <string.h>, <math.h>, <stdint.h> */

    uint32_t n = 10;
    int *arr = malloc(n * sizeof(int));
    if (!arr) {
        fprintf(stderr, "Out of memory\n");
        return 1;
    }

    for (uint32_t i = 0; i < n; i++) {
        arr[i] = (int)i;
    }

    printf("sqrt(2) = %.6f\n", sqrt(2.0));
    printf("strlen: %zu\n", strlen("hello"));

    char buf[64];
    snprintf(buf, sizeof(buf), "n = %u", n);
    puts(buf);

    free(arr);
    return 0;
}
