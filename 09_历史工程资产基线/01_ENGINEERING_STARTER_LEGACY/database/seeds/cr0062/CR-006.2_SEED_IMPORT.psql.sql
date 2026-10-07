\copy vehicle_colors(color_type,color_code,color_name,sort_order,enabled) FROM 'vehicle_colors.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
CREATE TEMP TABLE staging_jyt_vehicle_color_mappings(source_platform TEXT,color_type TEXT,upstream_value TEXT,target_color_code TEXT,mapping_kind TEXT);
\copy staging_jyt_vehicle_color_mappings(source_platform,color_type,upstream_value,target_color_code,mapping_kind) FROM 'jyt_vehicle_color_mappings.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
INSERT INTO jyt_vehicle_color_mappings(source_platform,color_type,upstream_value,vehicle_color_id,mapping_kind)
SELECT m.source_platform,m.color_type,m.upstream_value,c.color_id,m.mapping_kind
FROM staging_jyt_vehicle_color_mappings m JOIN vehicle_colors c ON c.color_type=m.color_type AND c.color_code=m.target_color_code;
\copy vehicle_condition_tags(tag_code,tag_name,sort_order,enabled) FROM 'vehicle_condition_tags.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
