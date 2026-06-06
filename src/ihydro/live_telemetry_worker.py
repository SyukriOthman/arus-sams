import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

# --- 1. SUPABASE CONNECTION SETUP ---
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. CONFIGURATION ---
BASE_URL = "https://ihydro.sarawak.gov.my/iHydro/en/datatable/waterlevel/latest-waterlevel.jsp?page="
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_total_pages():
    """Silently visits Page 1 to calculate exactly how many pages exist today."""
    try:
        print("🔍 Calculating total iHYDRO pages...")
        # Increased timeout to 45 seconds
        response = requests.get(f"{BASE_URL}1", headers=HEADERS, timeout=45)
        soup = BeautifulSoup(response.text, "html.parser")
        
        page_numbers = []
        for link in soup.select('.pagination a'):
            if link.text.strip().isdigit():
                page_numbers.append(int(link.text.strip()))
        
        max_pages = max(page_numbers) if page_numbers else 1
        print(f"📄 Found {max_pages} total pages to scrape.")
        
        # Polite delay before the main scraping starts
        time.sleep(2) 
        return max_pages
    except Exception as e:
        print(f"❌ Error finding pages: {e}")
        return 1

def scrape_all_live_data(max_pages):
    """Scrapes all pages and returns a dictionary."""
    live_data_dict = {}
    
    for page in range(1, max_pages + 1):
        print(f"📡 Scraping Page {page}/{max_pages}...")
        try:
            # Increased timeout to 45 seconds
            response = requests.get(f"{BASE_URL}{page}", headers=HEADERS, timeout=45)
            soup = BeautifulSoup(response.text, "html.parser")
            
            rows = soup.find_all("tr")
            
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 6: 
                    station_link = row.find('a')
                    if station_link and 'station=' in station_link.get('href', ''):
                        station_name = station_link.text.strip()
                        try:
                            water_level = float(cells[5].text.strip())
                            live_data_dict[station_name] = water_level
                        except ValueError:
                            continue 
            
            # Polite delay so we don't overwhelm the iHYDRO server
            time.sleep(2)

        except requests.exceptions.ReadTimeout:
            print(f"⚠️ Page {page} timed out! The government server is slow. Skipping page...")
            continue
        except Exception as e:
            print(f"❌ Unexpected error on Page {page}: {e}")
            continue

    return live_data_dict

def determine_status(water_level, normal, alert, warning, danger):
    """Calculates the flood state based on the station's specific thresholds."""
    if water_level >= danger:
        return 'danger'
    elif water_level >= warning:
        return 'warning'
    elif water_level >= alert:
        return 'alert'
    else:
        return 'normal'

def run_telemetry_pipeline():
    print("🌊 Starting Arus-SAMS Telemetry Pipeline...")

    # 1. Map the live website
    max_pages = get_total_pages()
    live_ihydro_data = scrape_all_live_data(max_pages)
    
    if not live_ihydro_data:
        print("❌ Scraper failed to gather data. Exiting.")
        return

    # 2. Get active stations AND their thresholds from Supabase
    response = supabase.table("school_station").select("station_id").execute()
    active_station_ids = list({row['station_id'] for row in response.data})
    
    print(f"🎯 Found {len(active_station_ids)} active stations mapped to schools.")

    if not active_station_ids:
        print("No stations currently tracked. Exiting.")
        return

    # Fetch the details for only the stations we care about
    station_lookup = supabase.table("stations").select(
        "station_id, station_name, normal_level, alert_level, warning_level, danger_level"
    ).in_("station_id", active_station_ids).execute()

    # 3. Cross-reference, Calculate, and Insert
    inserted_count = 0
    for station in station_lookup.data:
        station_name = station['station_name']
        
        if station_name in live_ihydro_data:
            current_water_level = live_ihydro_data[station_name]
            
            # Dynamically calculate if it is Safe, Warning, or Danger
            current_status = determine_status(
                current_water_level,
                station['normal_level'],
                station['alert_level'],
                station['warning_level'],
                station['danger_level']
            )
            
            # Insert the fresh data
            supabase.table("water_data").insert({
                "station_id": station['station_id'],
                "water_level": current_water_level,
                "status": current_status
            }).execute()
            
            # The Supabase Database Trigger will automatically catch 'warning'/'danger' and update 'is_critical'
            
            print(f"✅ Logged {station_name}: {current_status.upper()} at {current_water_level}m")
            inserted_count += 1
        else:
            print(f"⚠️ Warning: {station_name} was active in DB but not found on the iHYDRO website today.")

    # 4. Run Database Housekeeping (Clear data older than 7 days)
    print("🧹 Running automated 7-day housekeeping...")
    supabase.rpc("delete_old_water_data", {}).execute()
    
    print(f"🚀 Pipeline Complete! Successfully updated {inserted_count} stations.")

if __name__ == "__main__":
    run_telemetry_pipeline()