--
-- PostgreSQL database dump
--

-- Dumped from database version 11.14
-- Dumped by pg_dump version 14.8

-- Started on 2023-10-04 10:07:37

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 16 (class 2615 OID 84612356)
-- Name: spatialyzer_demo; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA spatialyzer_demo;


SET default_tablespace = '';

--
-- TOC entry 251 (class 1259 OID 84612426)
-- Name: adressen_p; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.adressen_p (
                                             id bigint,
                                             objectid integer,
                                             rid integer,
                                             strasse character varying(255),
                                             str_nummer character varying(200),
                                             plz character varying(200),
                                             ort character varying(200),
                                             se_anno_cad_data bytea,
                                             _predicate text,
                                             geom public.geometry(Geometry,25833)
);


--
-- TOC entry 256 (class 1259 OID 84612523)
-- Name: geol_hohlraumbas_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.geol_hohlraumbas_f (
                                                     id bigint,
                                                     objectid integer,
                                                     geodb_oid integer,
                                                     se_anno_cad_data bytea,
                                                     perimeter double precision,
                                                     geometrieflaeche double precision,
                                                     geometrieflaeche_eh character varying(20),
                                                     shape_area double precision,
                                                     shape_len double precision,
                                                     _predicate text,
                                                     geom public.geometry(Geometry,25833)
);


--
-- TOC entry 248 (class 1259 OID 84612408)
-- Name: geol_hohlraumuih_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.geol_hohlraumuih_f (
                                                     id bigint,
                                                     objectid integer,
                                                     geodb_oid integer,
                                                     se_anno_cad_data bytea,
                                                     id_geom_re character varying(10),
                                                     bufferval character varying(5),
                                                     idart_list character varying(5),
                                                     geometrieflaeche double precision,
                                                     geometrieflaeche_eh character varying(20),
                                                     shape_area double precision,
                                                     shape_len double precision,
                                                     _predicate text,
                                                     geom public.geometry(Geometry,25833)
);


--
-- TOC entry 253 (class 1259 OID 84612505)
-- Name: gesu_aspsz_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.gesu_aspsz_f (
                                               id bigint,
                                               objectid integer,
                                               name character varying(5),
                                               se_anno_cad_data bytea,
                                               shape_area double precision,
                                               shape_len double precision,
                                               _predicate text,
                                               geom public.geometry(Geometry,25833)
);


--
-- TOC entry 259 (class 1259 OID 84612541)
-- Name: kat_flurst_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.kat_flurst_f (
                                               id bigint,
                                               objectid integer,
                                               ifcid character varying(200),
                                               areavalue character varying(200),
                                               areavalue_uom character varying(200),
                                               areavalue_void character varying(200),
                                               beginlifespanversion character varying(200),
                                               beginlifespanversion_void character varying(200),
                                               endlifespanversion character varying(200),
                                               endlifespanversion_void character varying(200),
                                               id_localid character varying(200),
                                               id_namespace character varying(200),
                                               id_versionid character varying(200),
                                               id_versionid_void character varying(200),
                                               label character varying(200),
                                               nationalcadastralref character varying(200),
                                               validfrom character varying(200),
                                               validfrom_void character varying(200),
                                               validto character varying(200),
                                               validto_void character varying(200),
                                               baspropunit_void character varying(200),
                                               zoning character varying(200),
                                               zoning_void character varying(200),
                                               admunit character varying(200),
                                               admunit_void character varying(200),
                                               gemarkung_name character varying(200),
                                               geometrieflaeche double precision,
                                               geometrieflaeche_eh character varying(20),
                                               se_anno_cad_data bytea,
                                               shape_area double precision,
                                               shape_len double precision,
                                               _predicate text,
                                               geom public.geometry(Geometry,25833)
);


--
-- TOC entry 255 (class 1259 OID 84612517)
-- Name: kat_gemark_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.kat_gemark_f (
                                               id bigint,
                                               objectid integer,
                                               ifcid integer,
                                               beginlifespanversion timestamp without time zone,
                                               beginlifespanversion_void smallint,
                                               endlifespanversion timestamp without time zone,
                                               endlifespanversion_void smallint,
                                               estimatedaccuracy double precision,
                                               estimatedaccuracy_uom character varying(255),
                                               estimatedaccuracy_void smallint,
                                               id_localid character varying(255),
                                               id_namespace character varying(255),
                                               id_versionid character varying(255),
                                               id_versionid_void smallint,
                                               label character varying(255),
                                               level_ character varying(255),
                                               level_cl character varying(255),
                                               level_void smallint,
                                               levelname_void smallint,
                                               name_void smallint,
                                               nationalcadastalzoningref character varying(255),
                                               scale integer,
                                               scale_void smallint,
                                               validfrom timestamp without time zone,
                                               validfrom_void smallint,
                                               validto timestamp without time zone,
                                               validto_void smallint,
                                               upperlevelunit integer,
                                               upperlevelunit_void smallint,
                                               name character varying(255),
                                               geometrieflaeche double precision,
                                               geometrieflaeche_eh character varying(20),
                                               schluessel character varying(10),
                                               se_anno_cad_data bytea,
                                               shape_area double precision,
                                               shape_len double precision,
                                               _predicate text,
                                               geom public.geometry(Geometry,25833)
);


--
-- TOC entry 250 (class 1259 OID 84612420)
-- Name: umw_nat2000_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.umw_nat2000_f (
                                                id bigint,
                                                objectid integer,
                                                gml_parent_id character varying(200),
                                                gml_id character varying(200),
                                                typ character varying(200),
                                                natur_ffh_gebiete_area character varying(200),
                                                teilfl character varying(200),
                                                eu_nr character varying(200),
                                                erfassung character varying(200),
                                                info character varying(200),
                                                rechts_gl character varying(200),
                                                sn_nr character varying(200),
                                                gebiet character varying(200),
                                                meldeflaec character varying(200),
                                                legende character varying(200),
                                                natur_ffh_fledermaus_area character varying(200),
                                                objectid_1 character varying(200),
                                                natur_spa_area character varying(200),
                                                gebietsname character varying(200),
                                                geometrieflaeche double precision,
                                                geometrieflaeche_eh character varying(20),
                                                se_anno_cad_data bytea,
                                                shape_area double precision,
                                                shape_len double precision,
                                                _predicate text,
                                                geom public.geometry(Geometry,25833)
);


--
-- TOC entry 258 (class 1259 OID 84612535)
-- Name: umw_nat2000_p; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.umw_nat2000_p (
                                                id bigint,
                                                objectid integer,
                                                gml_parent_id character varying(200),
                                                gml_id character varying(200),
                                                typ character varying(200),
                                                natur_ffh_gebiete_area character varying(200),
                                                teilfl character varying(200),
                                                eu_nr character varying(200),
                                                erfassung character varying(200),
                                                info character varying(200),
                                                rechts_gl character varying(200),
                                                sn_nr character varying(200),
                                                gebiet character varying(200),
                                                meldeflaec character varying(200),
                                                legende character varying(200),
                                                ortsname character varying(200),
                                                natur_ffh_fledermaus_area character varying(200),
                                                objectid_1 character varying(200),
                                                natur_spa_area character varying(200),
                                                gebietsname character varying(200),
                                                se_anno_cad_data bytea,
                                                _predicate text,
                                                geom public.geometry(Geometry,25833)
);


--
-- TOC entry 260 (class 1259 OID 84612824)
-- Name: umw_schutzgeb_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.umw_schutzgeb_f (
                                                  id bigint,
                                                  objectid integer,
                                                  gml_parent_id character varying(200),
                                                  gml_id character varying(200),
                                                  teilarea character varying(200),
                                                  praezi character varying(200),
                                                  sg_nr character varying(200),
                                                  kategorie character varying(200),
                                                  status character varying(200),
                                                  name character varying(200),
                                                  zone character varying(200),
                                                  id_zo character varying(200),
                                                  erfnam character varying(200),
                                                  erfdat character varying(200),
                                                  uebnam character varying(200),
                                                  uebdat character varying(200),
                                                  sg_kategor character varying(200),
                                                  sg_status character varying(200),
                                                  erfassung character varying(200),
                                                  typ character varying(200),
                                                  geometrieflaeche double precision,
                                                  geometrieflaeche_eh character varying(20),
                                                  se_anno_cad_data bytea,
                                                  shape_area double precision,
                                                  shape_len double precision,
                                                  _predicate text,
                                                  geom public.geometry(Geometry,25833)
);


--
-- TOC entry 252 (class 1259 OID 84612499)
-- Name: umw_wassersch_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.umw_wassersch_f (
                                                  id bigint,
                                                  objectid integer,
                                                  gml_parent_id character varying(200),
                                                  gml_id character varying(200),
                                                  object_id character varying(200),
                                                  nummer character varying(200),
                                                  zone character varying(200),
                                                  teilzone character varying(200),
                                                  name character varying(200),
                                                  inkrafttreten character varying(200),
                                                  landkreis character varying(200),
                                                  landesdirektion character varying(200),
                                                  ezg character varying(200),
                                                  flaeche_in_ha character varying(200),
                                                  datenstand character varying(200),
                                                  typ character varying(200),
                                                  geometrieflaeche double precision,
                                                  geometrieflaeche_eh character varying(20),
                                                  se_anno_cad_data bytea,
                                                  shape_area double precision,
                                                  shape_len double precision,
                                                  _predicate text,
                                                  geom public.geometry(Geometry,25833)
);


--
-- TOC entry 257 (class 1259 OID 84612529)
-- Name: verw_gem_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.verw_gem_f (
                                             id bigint,
                                             objectid integer,
                                             ifcid integer,
                                             nationalcode character varying(255),
                                             id_localid character varying(255),
                                             id_namespace character varying(255),
                                             id_versionid character varying(255),
                                             id_versionid_void smallint,
                                             nationallevel character varying(255),
                                             nationallevel_cl character varying(255),
                                             nationallevelname_void smallint,
                                             country character varying(255),
                                             country_cl character varying(255),
                                             residence_void smallint,
                                             beginlifespanversion timestamp without time zone,
                                             beginlifespanversion_void smallint,
                                             endlifespanversion timestamp without time zone,
                                             endlifespanversion_void smallint,
                                             nuts_void smallint,
                                             condominium_void smallint,
                                             lowerlevelunit_void smallint,
                                             upperlevelunit integer,
                                             upperlevelunit_void smallint,
                                             admby_void smallint,
                                             coadminister_void smallint,
                                             boundary_void smallint,
                                             name character varying(255),
                                             geometrieflaeche double precision,
                                             geometrieflaeche_eh character varying(20),
                                             se_anno_cad_data bytea,
                                             shape_area double precision,
                                             shape_len double precision,
                                             _predicate text,
                                             geom public.geometry(Geometry,25833)
);


--
-- TOC entry 247 (class 1259 OID 84612391)
-- Name: verw_kreis_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.verw_kreis_f (
                                               id bigint,
                                               objectid integer,
                                               ifcid integer,
                                               nationalcode character varying(255),
                                               id_localid character varying(255),
                                               id_namespace character varying(255),
                                               id_versionid character varying(255),
                                               id_versionid_void smallint,
                                               nationallevel character varying(255),
                                               nationallevel_cl character varying(255),
                                               nationallevelname_void smallint,
                                               country character varying(255),
                                               country_cl character varying(255),
                                               residence_void smallint,
                                               beginlifespanversion timestamp without time zone,
                                               beginlifespanversion_void smallint,
                                               endlifespanversion timestamp without time zone,
                                               endlifespanversion_void smallint,
                                               nuts_void smallint,
                                               condominium_void smallint,
                                               lowerlevelunit_void smallint,
                                               upperlevelunit integer,
                                               upperlevelunit_void smallint,
                                               admby_void smallint,
                                               coadminister_void smallint,
                                               boundary_void smallint,
                                               name character varying(255),
                                               geometrieflaeche double precision,
                                               geometrieflaeche_eh character varying(20),
                                               se_anno_cad_data bytea,
                                               shape_area double precision,
                                               shape_len double precision,
                                               _predicate text,
                                               geom public.geometry(Geometry,25833)
);


--
-- TOC entry 254 (class 1259 OID 84612511)
-- Name: verw_land_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.verw_land_f (
                                              id bigint,
                                              objectid integer,
                                              id00 character varying(10),
                                              name character varying(20),
                                              nuts_code character varying(10),
                                              egm_code character varying(10),
                                              land character varying(55),
                                              bundesland character varying(20),
                                              geometrieflaeche double precision,
                                              geometrieflaeche_eh character varying(20),
                                              se_anno_cad_data bytea,
                                              shape_area double precision,
                                              shape_len double precision,
                                              _predicate text,
                                              geom public.geometry(Geometry,25833)
);


--
-- TOC entry 249 (class 1259 OID 84612414)
-- Name: verw_zust_f; Type: TABLE; Schema: spatialyzer_demo; Owner: -
--

CREATE TABLE spatialyzer_demo.verw_zust_f (
                                              id bigint,
                                              objectid integer,
                                              gemeindename character varying(35),
                                              gemeindeschluessel integer,
                                              ubabschluessel character varying(7),
                                              se_anno_cad_data bytea,
                                              shape_area double precision,
                                              shape_len double precision,
                                              _predicate text,
                                              geom public.geometry(Geometry,25833)
);