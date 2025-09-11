#!/usr/bin/env python3
"""
Test script to verify file locking prevents race conditions
"""

import asyncio
import aiohttp
import json
import time

async def create_struktur_item(session, item_type, nama, deskripsi, parent_id=None):
    """Create a single struktur organisasi item"""
    url = 'http://localhost:5000/api/config/struktur-organisasi'
    data = {
        'type': item_type,
        'nama': nama,
        'deskripsi': deskripsi,
        'parent_id': parent_id
    }
    
    try:
        async with session.post(url, json=data) as response:
            if response.status in [200, 201]:  # Both OK and Created are success
                result = await response.json()
                print(f"✅ Created {item_type}: {nama}")
                return result.get('struktur', {}).get('id')
            else:
                text = await response.text()
                print(f"❌ Failed to create {item_type}: {nama} - {response.status} - {text}")
                return None
    except Exception as e:
        print(f"❌ Exception creating {item_type}: {nama} - {e}")
        return None

async def test_concurrent_writes():
    """Test concurrent writes to verify file locking works"""
    print("🔥 Testing concurrent writes to verify file locking...")
    
    # Create 20 concurrent requests
    test_items = [
        ('direktorat', f'Test Direktorat {i}', f'Test Description {i}')
        for i in range(20)
    ]
    
    async with aiohttp.ClientSession() as session:
        start_time = time.time()
        
        # Create all items concurrently
        tasks = [
            create_struktur_item(session, item_type, nama, deskripsi)
            for item_type, nama, deskripsi in test_items
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        end_time = time.time()
        
        # Count successful creations
        successful = sum(1 for r in results if r is not None and not isinstance(r, Exception))
        failed = len(results) - successful
        
        print(f"\n📊 Results:")
        print(f"   Total requests: {len(test_items)}")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"   Time taken: {end_time - start_time:.2f} seconds")
        
        # Verify data persistence
        await asyncio.sleep(2)  # Wait for all writes to complete
        
        async with session.get('http://localhost:5000/api/config/struktur-organisasi') as response:
            if response.status == 200:
                data = await response.json()
                total_count = len(data['direktorat']) + len(data['subdirektorat']) + len(data['divisi'])
                print(f"   Total items in storage: {total_count}")
                print(f"   Direktorat: {len(data['direktorat'])}")
                print(f"   Subdirektorat: {len(data['subdirektorat'])}")  
                print(f"   Divisi: {len(data['divisi'])}")
            else:
                print(f"   ❌ Failed to fetch final data: {response.status}")

if __name__ == "__main__":
    asyncio.run(test_concurrent_writes())