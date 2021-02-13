import csv, json

csv_doc = "test_data_labeled.csv"
with open(csv_doc, newline="") as csvfile:
    reader = csv.DictReader(csvfile)
    data = {}
    for row in reader:
        for header, value in row.items():
            if header == "text" or header == "authorName":
                try:
                    data[header].append(value)
                except KeyError:
                    data[header] = [value]

json_data = {}
json_data["nodes"] = []
for author, text in list(zip(data["authorName"], data["text"])):
    json_data["nodes"].append({"id": text, "author": author})
with open("data.json", "w") as outfile:
    json.dump(json_data, outfile)
