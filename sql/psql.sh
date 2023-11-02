#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
COPY spatialyzer_demo.verw_kreis_f (id, objectid, ifcid, nationalcode, id_localid, id_namespace, id_versionid, id_versionid_void, nationallevel, nationallevel_cl, nationallevelname_void, country, country_cl, residence_void, beginlifespanversion, beginlifespanversion_void, endlifespanversion, endlifespanversion_void, nuts_void, condominium_void, lowerlevelunit_void, upperlevelunit, upperlevelunit_void, admby_void, coadminister_void, boundary_void, name, geometrieflaeche, geometrieflaeche_eh, se_anno_cad_data, shape_area, shape_len, _predicate, geom) FROM '/docker-entrypoint-initdb.d/kreis.txt' DELIMITER ',';
COPY spatialyzer_demo.adressen_p (id, objectid, rid, strasse, str_nummer, plz, ort, se_anno_cad_data, _predicate, geom) FROM '/docker-entrypoint-initdb.d/address.txt' DELIMITER ',';
EOSQL