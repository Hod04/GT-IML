import csv, json, shutil

data_csv_doc = "data.csv"
# cosine_distances_doc = "cosine_distances.csv"
data_json_file = "data.json"

# extract the comments from the data csv doc
with open(data_csv_doc, newline="") as data_csv_file:
    reader = csv.DictReader(data_csv_file)
    data = {}
    for row in reader:
        for header, value in row.items():
            if (
                header == "index"
                or header == "publishedAt"
                or header == "text"
                or header == "authorName"
            ):
                try:
                    data[header].append(value)
                except KeyError:
                    data[header] = [value]

json_data = {}
json_data["nodes"] = []

id_array = []

# construct the node objects
for index, publishedAt, author, text in list(
    zip(
        data["index"],
        data["publishedAt"],
        data["authorName"],
        data["text"],
    )
):
    first_words = " ".join(text.split()[:3])
    json_data["nodes"].append(
        {
            "id": int(index),
            "nodeLabel": f"{first_words}...",
            "text": text,
            "author": author,
            "publishedAt": publishedAt,
        }
    )

    id_array.append(int(index))

# save the json file
with open(data_json_file, "w") as outfile:
    json.dump(json_data, outfile)
shutil.move("data.json", "../../frontend/public/data/data.json")
