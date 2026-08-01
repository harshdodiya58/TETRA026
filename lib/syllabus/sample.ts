/**
 * A realistic VTU-style syllabus for demos and for exercising the chunker.
 *
 * Deliberately messy in the ways real documents are: hour counts written three
 * different ways ("09 Hours", "[08 Hrs]", "10 Periods"), inconsistent unit
 * separators, and Course Outcomes that mix explicit "CO1:" prefixes with plain
 * numbered lines. If the chunker only handles tidy input it does not work.
 */
export const SAMPLE_SYLLABUS_NAME = "CS304_DBMS_VTU_sample.txt";

export const SAMPLE_SYLLABUS = `VISVESVARAYA TECHNOLOGICAL UNIVERSITY, BELAGAVI
B.E. COMPUTER SCIENCE AND ENGINEERING
Scheme of Teaching and Examinations - Semester V

DATABASE MANAGEMENT SYSTEMS
Course Code: CS304                          CIE Marks: 50
Teaching Hours/Week (L:T:P): 3:0:2          SEE Marks: 50
Total Contact Hours: 45                     Credits: 04

UNIT - I                                                        (09 Hours)
Introduction to Databases: Characteristics of the database approach, Actors on
the scene, Advantages of using the DBMS approach. Data models, schemas and
instances, Three-schema architecture and data independence, Database languages
and interfaces, The database system environment. Entity-Relationship model,
Entity types, Entity sets, Attributes and keys, Relationship types, Weak entity
types, Drawing ER diagrams by hand, Naming conventions and design issues.

UNIT - II                                                       [08 Hrs]
Relational Model and Relational Algebra: Relational model concepts, Relational
model constraints and relational database schemas, Update operations,
Transactions and dealing with constraint violations. Unary relational
operations SELECT and PROJECT, Relational algebra operations from set theory,
Binary relational operations JOIN and DIVISION, Additional relational
operations, Examples of queries in relational algebra. Relational calculus,
Tuple relational calculus, Domain relational calculus.

UNIT - III                                                      10 Periods
SQL and Stored Procedures: SQL data definition and data types, Specifying
constraints in SQL, Basic retrieval queries in SQL, INSERT DELETE and UPDATE
statements, Views and view implementation, Schema change statements. Cursors,
Writing stored procedures in PL/SQL, Triggers and assertions, Embedded SQL,
Dynamic SQL, Database programming with JDBC, Stored procedure invocation from
host languages.

UNIT - IV                                                       (09 Hours)
Database Design and Normalization: Informal design guidelines for relation
schemas, Functional dependencies, Normal forms based on primary keys, General
definitions of second and third normal forms, Boyce-Codd normal form,
Multivalued dependency and fourth normal form, Join dependencies and fifth
normal form. Properties of relational decompositions, Algorithms for relational
database schema design, Nulls dangling tuples and alternative relational
designs.

UNIT - V                                                        (09 Hours)
Transaction Processing and Concurrency Control: Introduction to transaction
processing, Transaction and system concepts, Desirable properties of
transactions, Characterizing schedules based on recoverability and
serializability. Two-phase locking techniques for concurrency control,
Concurrency control based on timestamp ordering, Multiversion concurrency
control techniques, Granularity of data items and multiple granularity locking.
Database recovery concepts, Recovery techniques based on deferred update,
Shadow paging, The ARIES recovery algorithm.

COURSE OUTCOMES
At the end of the course the student will be able to:
CO1: Describe the fundamental concepts of database management systems and the
three-schema architecture.
CO2: Construct entity-relationship diagrams for a given application domain.
CO3: Apply relational algebra and SQL to formulate queries against a relational
schema.
CO4: Analyse a relational schema and normalise it up to Boyce-Codd normal form.
CO5: Explain transaction processing, concurrency control protocols and database
recovery techniques.

TEXT BOOKS
1. Elmasri and Navathe, Fundamentals of Database Systems, 7th Edition, Pearson,
2017.
2. Silberschatz, Korth and Sudarshan, Database System Concepts, 6th Edition,
McGraw Hill, 2011.

REFERENCE BOOKS
1. C.J. Date, An Introduction to Database Systems, 8th Edition, Pearson, 2003.
2. Raghu Ramakrishnan and Johannes Gehrke, Database Management Systems, 3rd
Edition, McGraw Hill, 2014.
`;

export function sampleSyllabusFile(): File {
  return new File([SAMPLE_SYLLABUS], SAMPLE_SYLLABUS_NAME, { type: "text/plain" });
}
