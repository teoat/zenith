import sys
import os
import unittest
import numpy as np
import time

# Add backend directory to path
sys.path.append(os.path.abspath("backend"))

from app.services.evidence_service import evidence_processor

class TestEvidenceProcessorPerformance(unittest.TestCase):
    def test_detect_clone_regions_optimized(self):
        """Test that the optimized clone detection works correctly and efficiently"""
        # Create a random image
        height, width = 1024, 1024
        image_np = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)

        # Plant a clone (ALIGNED)
        # 96 is divisible by 32 (3 * 32)
        # 480 is divisible by 32 (15 * 32)
        image_np[480:480+32, 480:480+32] = image_np[96:96+32, 96:96+32]

        start_time = time.time()
        result = evidence_processor._detect_clone_regions(image_np)
        end_time = time.time()

        # Assert functional correctness
        self.assertTrue(result["clone_regions_detected"])
        self.assertEqual(result["clone_detection_method"], "hash_map_lookup_optimized")

        # Performance check - should be very fast (< 0.1s)
        # The unoptimized version took ~0.6s on this machine, optimized took ~0.005s
        print(f"Clone detection took: {end_time - start_time:.6f}s")
        self.assertLess(end_time - start_time, 0.2, "Clone detection was too slow")

        # Test negative case
        image_clean = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
        result_clean = evidence_processor._detect_clone_regions(image_clean)
        self.assertFalse(result_clean["clone_regions_detected"])

if __name__ == "__main__":
    unittest.main()
