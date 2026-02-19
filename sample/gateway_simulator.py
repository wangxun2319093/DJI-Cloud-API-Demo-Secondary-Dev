#!/usr/bin/env python3
import json
import time
import uuid
import random
import paho.mqtt.client as mqtt

MQTT_BROKER = "10.39.29.101"
MQTT_PORT = 1883
MQTT_USERNAME = "admin"
MQTT_PASSWORD = "admin"

GATEWAY_SN = "GATEWAYSIM001"
DRONE_SN = "DRONE_GATEWAY_001"

GATEWAY_TYPE = 119
GATEWAY_SUB_TYPE = 0
GATEWAY_DOMAIN = 2

DRONE_TYPE = 89
DRONE_SUB_TYPE = 0
DRONE_DOMAIN = 0

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

def create_status_message():
    return {
        "tid": str(uuid.uuid4()),
        "bid": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "data": {
            "domain": GATEWAY_DOMAIN,
            "type": GATEWAY_TYPE,
            "subType": GATEWAY_SUB_TYPE,
            "deviceSecret": "",
            "nonce": "",
            "thingVersion": "1.0.0",
            "subDevices": [
                {
                    "sn": DRONE_SN,
                    "domain": DRONE_DOMAIN,
                    "type": DRONE_TYPE,
                    "subType": DRONE_SUB_TYPE,
                    "index": "A",
                    "deviceSecret": "",
                    "nonce": "",
                    "thingVersion": "1.0.0"
                }
            ]
        }
    }

def create_gateway_osd():
    four_g_quality = random.randint(3, 5)
    sdr_quality = random.randint(3, 5)
    link_workmode = 1 if four_g_quality >= 3 else 0
    
    return {
        "tid": str(uuid.uuid4()),
        "bid": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "gateway": GATEWAY_SN,
        "data": {
            "latitude": 30.5728 + random.uniform(-0.0001, 0.0001),
            "longitude": 114.2793 + random.uniform(-0.0001, 0.0001),
            "height": 0.0,
            "capacity_percent": random.randint(80, 100),
            "wireless_link": {
                "4g_freq_band": 1.8,
                "4g_gnd_quality": four_g_quality,
                "4g_link_state": True,
                "4g_quality": four_g_quality,
                "4g_uav_quality": random.randint(3, 5),
                "dongle_number": 1,
                "link_workmode": link_workmode,
                "sdr_freq_band": 2.4,
                "sdr_link_state": True,
                "sdr_quality": sdr_quality
            }
        }
    }

def create_drone_osd(mode_code=0, height=0.0):
    return {
        "tid": str(uuid.uuid4()),
        "bid": str(uuid.uuid4()),
        "timestamp": int(time.time() * 1000),
        "gateway": GATEWAY_SN,
        "data": {
            "attitude_head": random.uniform(0, 360),
            "attitude_pitch": random.uniform(-10, 10),
            "attitude_roll": random.uniform(-10, 10),
            "elevation": 50.0,
            "battery": {
                "capacity_percent": random.uniform(80, 100),
                "landing_power": 20.0,
                "remain_flight_time": 1800,
                "return_home_power": 30.0,
                "battery_index": 0
            },
            "firmware_version": "07.01.10.03",
            "gear": 1 if mode_code > 0 else 0,
            "height": height,
            "home_distance": random.uniform(100, 5000) if mode_code > 0 else 0.0,
            "horizontal_speed": random.uniform(0, 15) if mode_code > 0 else 0.0,
            "latitude": 30.5728 + random.uniform(-0.001, 0.001),
            "longitude": 114.2793 + random.uniform(-0.001, 0.001),
            "mode_code": mode_code,
            "total_flight_distance": random.uniform(0, 10000),
            "total_flight_time": random.uniform(0, 3600),
            "vertical_speed": random.uniform(-5, 5) if mode_code > 0 else 0.0,
            "wind_direction": random.randint(0, 7),
            "wind_speed": random.uniform(0, 10),
            "position_state": {
                "gps_number": random.randint(10, 20),
                "rtk_number": 0,
                "is_fixed": 0
            },
            "storage": {
                "total": 64000,
                "used": random.randint(1000, 10000)
            },
            "night_lights_state": 0,
            "height_limit": 120,
            "total_flight_sorties": random.randint(0, 100),
            "country": "CN",
            "rid_state": False,
            "is_near_area_limit": False,
            "is_near_height_limit": False,
            "track_id": ""
        }
    }

def main():
    client = mqtt.Client(client_id=f"gateway_sim_{GATEWAY_SN}")
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    
    print(f"Connecting to {MQTT_BROKER}:{MQTT_PORT}...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    
    time.sleep(2)
    
    status_msg = create_status_message()
    client.publish(f"sys/product/{GATEWAY_SN}/status", json.dumps(status_msg))
    print(f"Sent status message for {GATEWAY_SN} with subDevice {DRONE_SN}")
    
    time.sleep(1)
    
    mode_code = 0
    mode_counter = 0
    drone_height = 0.0
    
    try:
        while True:
            gateway_osd = create_gateway_osd()
            client.publish(f"thing/product/{GATEWAY_SN}/osd", json.dumps(gateway_osd))
            
            mode_counter += 1
            if mode_counter >= 30:
                mode_counter = 0
                mode_code = (mode_code + 1) % 10
                if mode_code == 1:
                    mode_code = 3
                if mode_code == 0:
                    drone_height = 0.0
                else:
                    drone_height = random.uniform(10, 120)
            
            drone_osd = create_drone_osd(mode_code, drone_height)
            client.publish(f"thing/product/{DRONE_SN}/osd", json.dumps(drone_osd))
            
            wl = gateway_osd['data']['wireless_link']
            print(f"Published: Gateway 4G=Q{wl['4g_quality']}, SDR=Q{wl['sdr_quality']} | "
                  f"Drone {DRONE_SN}: height={drone_height:.1f}m, mode={mode_code}, speed={drone_osd['data']['horizontal_speed']:.1f}m/s")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping...")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
