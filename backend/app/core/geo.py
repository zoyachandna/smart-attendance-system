from geopy.distance import geodesic

def is_within_radius(user_lat: float, user_lon: float, class_lat: float, class_lon: float, radius_meters: float) -> tuple[bool, float]:
    """
    Checks if the user's coordinates are within the classroom's allowed radius.
    Returns (is_within_radius, actual_distance_meters).
    """
    if None in (user_lat, user_lon, class_lat, class_lon):
        return False, -1.0
        
    user_coords = (user_lat, user_lon)
    class_coords = (class_lat, class_lon)
    
    distance = geodesic(user_coords, class_coords).meters
    return distance <= radius_meters, distance
