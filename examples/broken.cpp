// broken.cpp — example file with missing includes for AutoInclude demo
// Run "AutoInclude: Fix includes in current file" to fix it.

#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    // Missing: <vector>, <string>, <iostream>, <algorithm>, <memory>, <unordered_map>

    std::vector<int> nums = {5, 3, 1, 4, 2};
    std::sort(nums.begin(), nums.end());

    std::string greeting = "Hello, AutoInclude!";
    std::cout << greeting << std::endl;

    auto ptr = std::make_unique<int>(42);
    std::cout << "Value: " << *ptr << std::endl;

    std::unordered_map<std::string, int> scores;
    scores["Alice"] = 100;
    scores["Bob"]   = 95;

    for (const auto& [name, score] : scores) {
        std::cout << name << ": " << score << "\n";
    }

    return 0;
}
