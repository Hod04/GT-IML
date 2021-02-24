import csv, json, shutil

csv_doc = "sea_level_rise_omer_data_Transformer_sea_level_rise_filtered.csv"
with open(csv_doc, newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    data = {}
    for row in reader:
        for header, value in row.items():
            if (
                header == "publishedAt"
                or header == "label_kmedoids"
                or header == "text"
                or header == "authorName"
            ):
                try:
                    data[header].append(value)
                except KeyError:
                    data[header] = [value]

json_data = {}
json_data["nodes"] = []
for publishedAt, label_kmedoids, author, text in list(
    zip(data["publishedAt"], data["label_kmedoids"], data["authorName"], data["text"])
):
    json_data["nodes"].append(
        {
            "id": text,
            "group": label_kmedoids,
            "author": author,
            "publishedAt": publishedAt,
        }
    )
with open("data.json", "w") as outfile:
    json.dump(json_data, outfile)
shutil.move("data.json", "../../frontend/public/data/data.json")
