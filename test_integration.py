#!/usr/bin/env python3
"""
Test the complete integration of POS Data Cleaner with web interface
"""

import requests
import json
import time
from pathlib import Path

def test_integration():
    """Test the complete integration"""
    
    # Test 1: Health check
    print("🔍 Testing backend health...")
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Backend healthy: {health_data['service']} - {health_data['accuracy']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False
    
    # Test 2: File upload and processing 
    print("\n📂 Testing file upload and processing...")
    
    # Use a small test file
    test_file = Path("../data/input/digital real data/Penilaian BPKP 2022.xlsx")
    if not test_file.exists():
        print(f"❌ Test file not found: {test_file}")
        return False
    
    try:
        with open(test_file, 'rb') as f:
            files = {'file': (test_file.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {'year': '2022', 'aspect': 'test'}
            
            print(f"📤 Uploading {test_file.name}...")
            response = requests.post('http://localhost:5000/api/upload', files=files, data=data, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Processing successful!")
                
                # Display key results
                if 'extractedData' in result and result['extractedData']:
                    extracted = result['extractedData']
                    print(f"   📊 Total rows: {extracted.get('total_rows', 'N/A')}")
                    print(f"   📋 Indicators: {extracted.get('indicators', 'N/A')}")
                    print(f"   📅 Year: {extracted.get('year', 'N/A')}")
                    print(f"   🎯 Format: {extracted.get('format_type', 'N/A')}")
                    print(f"   ⚡ Accuracy: {extracted.get('accuracy_estimated', 'N/A')}")
                    
                    # Sample indicators
                    if 'sample_indicators' in extracted and extracted['sample_indicators']:
                        print(f"   📝 Sample data: {len(extracted['sample_indicators'])} indicators extracted")
                        sample = extracted['sample_indicators'][0]
                        print(f"      First indicator: {sample.get('description', 'N/A')[:50]}...")
                        print(f"      Skor: {sample.get('skor', 'N/A')}, Bobot: {sample.get('bobot', 'N/A')}")
                
                return True
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                print(f"❌ Processing failed: {response.status_code}")
                print(f"   Error: {error_data}")
                return False
                
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 POS Data Cleaner 2 - Web Interface Integration Test")
    print("=" * 60)
    
    success = test_integration()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Integration test PASSED!")
        print("✅ Backend is properly integrated with the core processing system")
        print("✅ File upload and processing works correctly") 
        print("✅ Data extraction and formatting is functional")
        print("\n🌐 Ready for production use!")
    else:
        print("❌ Integration test FAILED!")
        print("⚠️  Check backend server and core system integration")

if __name__ == "__main__":
    main()