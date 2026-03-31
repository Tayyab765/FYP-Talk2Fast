import requests
from bs4 import BeautifulSoup
import time, csv

BASE_URL = "https://www.payscale.com"
START_URL = f"{BASE_URL}/research/PK/Job"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def get_all_job_links():
    print("Fetching job list...")
    resp = requests.get(START_URL, headers=headers)
    soup = BeautifulSoup(resp.text, "html.parser")
    links = []
    for a in soup.select("a[href*='/research/PK/Job=']"):
        href = a.get("href")
        if "/Salary" in href:
            links.append(BASE_URL + href)
    return list(set(links))

def parse_job_page(url):
    print(f"Scraping {url}")
    resp = requests.get(url, headers=headers)
    soup = BeautifulSoup(resp.text, "html.parser")
    job_data = {"url": url}

    # --- Basic Salary ---
    salary_span = soup.select_one(".paycharts__value")
    job_data["average_salary"] = salary_span.text.strip() if salary_span else None

    period = soup.select_one(".Dropdown-placeholder")
    job_data["salary_period"] = period.text.strip() if period else None

    avg_desc = soup.select_one(".paycharts__percentile--desc")
    job_data["summary"] = avg_desc.text.strip() if avg_desc else None

    # --- Percentiles ---
    median = soup.select_one(".percentile-chart__median")
    job_data["median_salary"] = median.text.strip() if median else None

    # --- Job Title ---
    title_tag = soup.find("h1")
    job_data["job_title"] = title_tag.text.strip() if title_tag else None

    # --- Health Benefits ---
    benefits = {}
    for div in soup.select(".healthbenefits__item"):
        name = div.select_one(".healthbenefits__item-name").text.strip()
        value = div.select_one(".healthbenefits__item-value").text.strip()
        benefits[name] = value
    job_data["benefits"] = benefits

    # --- Gender Breakdown ---
    gender_data = {}
    for div in soup.select(".gender__item"):
        g = div.select_one(".gender__label").text.strip()
        v = div.select_one(".gender__value").text.strip()
        gender_data[g] = v
    job_data["gender"] = gender_data

    # --- Pay by Experience ---
    exp_levels = {}
    for entry in soup.select(".delta-table .entry"):
        name = entry.select_one(".name").text.strip()
        arrow = entry.select_one(".arrow").text.strip()
        exp_levels[name] = arrow
    job_data["experience_levels"] = exp_levels

    time.sleep(2)
    return job_data

def save_to_csv(data, filename):
    keys = sorted(set(k for d in data for k in d.keys()))
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)

if __name__ == "__main__":
    job_links = get_all_job_links()
    dataset = []
    for link in job_links:
        dataset.append(parse_job_page(link))
    save_to_csv(dataset, "pakistan_job_salaries.csv")
