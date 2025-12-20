#!/bin/bash
# System Resource Monitor and Optimizer
# Monitors system resources and provides cleanup recommendations

echo "🔍 System Resource Analysis"
echo "============================"

# Get system resource usage
echo "Current System Resources:"
CPU_USAGE=$(ps aux | awk 'NR>1 {cpu+=$3} END {print cpu}')
MEMORY_USAGE=$(ps aux | awk 'NR>1 {mem+=$4} END {print mem}')
PROCESS_COUNT=$(ps aux | wc -l)

echo "Total CPU Usage: ${CPU_USAGE}%"
echo "Total Memory Usage: ${MEMORY_USAGE}%"
echo "Total Processes: ${PROCESS_COUNT}"

echo ""
echo "Top CPU Consumers:"
ps aux | head -1
ps aux | sort -nrk 3 | head -6

echo ""
echo "Top Memory Consumers:"
ps aux | head -1
ps aux | sort -nrk 4 | head -6

echo ""
echo "Development Process Analysis:"
echo "TypeScript servers:"
ps aux | grep tsserver | grep -v grep | wc -l

echo "ESLint servers:"
ps aux | grep eslint | grep -v grep | wc -l

echo "Test processes:"
ps aux | grep -E "(pytest|jest|test)" | grep -v grep | wc -l

echo "Node.js processes:"
ps aux | grep node | grep -v grep | wc -l

echo ""
echo "Recommendations:"
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "⚠️  HIGH CPU USAGE - Consider killing unnecessary processes"
fi

if (( $(echo "$MEMORY_USAGE > 70" | bc -l) )); then
    echo "⚠️  HIGH MEMORY USAGE - Consider freeing up memory"
fi

if [ "$PROCESS_COUNT" -gt 200 ]; then
    echo "⚠️  HIGH PROCESS COUNT - Consider process cleanup"
fi

echo ""
echo "Cleanup Commands:"
echo "# Kill high-CPU test processes:"
echo "ps aux | grep pytest | grep -v grep | awk '{print \$2}' | xargs kill -9"
echo ""
echo "# Kill excessive TypeScript servers:"
echo "ps aux | grep tsserver | grep -v grep | head -5 | awk '{print \$2}' | xargs kill -9"
echo ""
echo "# Kill ESLint processes:"
echo "ps aux | grep eslint | grep -v grep | awk '{print \$2}' | xargs kill -9"