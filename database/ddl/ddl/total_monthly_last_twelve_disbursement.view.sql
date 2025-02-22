--
-- PostgreSQL database dump
--

-- Dumped from database version 12.6 (Debian 12.6-1.pgdg100+1)
-- Dumped by pg_dump version 12.6 (Debian 12.6-1.pgdg100+1)

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
-- Name: total_monthly_last_twelve_disbursement; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.total_monthly_last_twelve_disbursement AS
 SELECT a.period,
    a.year,
    a.month,
    a.month_long,
    a.period_date,
    a.source,
    a.sort_order,
    a.fund_class,
    a.recipient,
    sum(a.sum) AS sum
   FROM ( SELECT period.period,
            period.calendar_year AS year,
            period.month,
            period.month_long,
            period.period_date,
            fund.recipient,
                CASE
                    WHEN ((fund.fund_class)::text = ANY (ARRAY[('Native American tribes and individuals'::character varying)::text, ('Land and Water Conservation Fund'::character varying)::text, ('Reclamation Fund'::character varying)::text, ('State and local governments'::character varying)::text, ('U.S. Treasury'::character varying)::text, ('Historic Preservation Fund'::character varying)::text])) THEN fund.fund_class
                    ELSE 'Other funds'::character varying
                END AS fund_class,
                CASE
                    WHEN ((location.land_class)::text = 'Native American'::text) THEN 'Native American'::text
                    WHEN ((location.land_category)::text = 'Not Tied to a Lease'::text) THEN 'Federal - not tied to a lease'::text
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = ''::text)) THEN 'Federal - not tied to a location'::text
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 'Federal Onshore'::text
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 'Federal Offshore'::text
                    ELSE concat('Unknown: ', location.land_class, ' - ', location.land_category)
                END AS source,
                CASE
                    WHEN ((location.land_class)::text = 'Native American'::text) THEN 2
                    WHEN ((location.land_category)::text = 'Not Tied to a Lease'::text) THEN 0
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = ''::text)) THEN 1
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Onshore'::text)) THEN 4
                    WHEN (((location.land_class)::text = 'Federal'::text) AND ((location.land_category)::text = 'Offshore'::text)) THEN 3
                    ELSE 0
                END AS sort_order,
            sum(disbursement.disbursement) AS sum
           FROM (((public.disbursement
             JOIN public.period USING (period_id))
             JOIN public.location USING (location_id))
             JOIN public.fund USING (fund_id))
          WHERE (((period.period)::text = 'Monthly'::text) AND (period.period_date > ( SELECT (max(period_1.period_date) - '1 year'::interval)
                   FROM (public.disbursement disbursement_1
                     JOIN public.period period_1 USING (period_id))
                  WHERE ((period_1.period)::text = 'Monthly'::text))))
          GROUP BY period.period, period.calendar_year, period.month, period.month_long, period.period_date, location.land_class, location.land_category, fund.fund_class, fund.recipient) a
  GROUP BY a.period, a.year, a.month, a.month_long, a.period_date, a.source, a.sort_order, a.fund_class, a.recipient
  ORDER BY a.period, a.year, a.month, a.sort_order;


ALTER TABLE public.total_monthly_last_twelve_disbursement OWNER TO postgres;

--
-- PostgreSQL database dump complete
--

