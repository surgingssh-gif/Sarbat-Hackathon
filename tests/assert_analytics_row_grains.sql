with failures as (
    select 'stg_secondary_student_responses' as model_name
    where (select count(*) from {{ ref('stg_secondary_student_responses') }}) <> 671922

    union all

    select 'fct_secondary_student_response'
    where (select count(*) from {{ ref('fct_secondary_student_response') }}) <> 671922

    union all

    select 'stg_vocational_student_responses'
    where (select count(*) from {{ ref('stg_vocational_student_responses') }}) <> 28341

    union all

    select 'fct_vocational_student_response'
    where (select count(*) from {{ ref('fct_vocational_student_response') }}) <> 28341

    union all

    select 'dim_district'
    where (select count(*) from {{ ref('dim_district') }}) <> 24

    union all

    select 'dim_school'
    where (select count(*) from {{ ref('dim_school') }}) <> 3657

    union all

    select 'dim_vocational_institution'
    where (select count(*) from {{ ref('dim_vocational_institution') }}) <> 392
)

select * from failures
