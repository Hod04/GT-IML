import csv, json, shutil

data_csv_doc = "data.csv"
cosine_distances_doc = "cosine_distances.csv"
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
                or header == "label_kmedoids"
                or header == "text"
                or header == "authorName"
                or header == "distance_kmedoids"
            ):
                try:
                    data[header].append(value)
                except KeyError:
                    data[header] = [value]

json_data = {}
json_data["nodes"] = []

id_array = []

# construct the node objects
for index, publishedAt, label_kmedoids, author, text, distance_kmedoids in list(
    zip(
        data["index"],
        data["publishedAt"],
        data["label_kmedoids"],
        data["authorName"],
        data["text"],
        data["distance_kmedoids"],
    )
):
    first_words = " ".join(text.split()[:3])
    json_data["nodes"].append(
        {
            "id": int(index),
            "nodeLabel": f"{first_words}...",
            "text": text,
            "group": int(label_kmedoids),
            "author": author,
            "publishedAt": publishedAt,
            "distanceFromClusterMedoid": float(distance_kmedoids),
            "distances": {},
        }
    )

    id_array.append(int(index))

# assign distance object for every node
with open(cosine_distances_doc, newline="") as cos_dist_csv_file:
    reader = csv.reader(cos_dist_csv_file)
    cos_dist_data = {}
    for row in enumerate(reader):
        row_index = row[0]
        row_values = row[1]
        for distance in enumerate(row_values):
            distance_index = distance[0]
            distance_value = distance[1]
            if json_data["nodes"][row_index]["id"] != id_array[distance_index]:
                json_data["nodes"][row_index]["distances"][
                    id_array[distance_index]
                ] = float(distance_value)

# save the json file
with open(data_json_file, "w") as outfile:
    json.dump(json_data, outfile)
shutil.move("data.json", "../../frontend/public/data/data.json")
