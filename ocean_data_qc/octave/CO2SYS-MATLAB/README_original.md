CITATION:
van Heuven, S., D. Pierrot, J.W.B. Rae, E. Lewis, and D.W.R. Wallace. 2011.
MATLAB Program Developed for CO2 System Calculations. ORNL/CDIAC-105b.
Carbon Dioxide Information Analysis Center, Oak Ridge National Laboratory, U.S.
Department of Energy, Oak Ridge, Tennessee. doi: 10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1


CO2SYS version 1.1 (Sept 2011)

ABOUT CO2SYS:
This is a MATLAB-version of the original CO2SYS for DOS. CO2SYS calculates and returns a detailed 
state of the carbonate system of oceanographic water samples, if supplied with enough input. Use 
this function as you would use any other Matlab inline funtion, i.e., a=func(b,c). For extended 
details on using the function, please refer to the enclosed help by typing "help CO2SYS" in Matlab. 
For details on the internal workings of the function, please refer to the original  publication of 
Lewis and Wallace at http://cdiac.ornl.gov/oceans/co2rprt.html. Note that this function allows 
for the input of vectors. This means that you can calculate many samples at once. Each of these 
samples can be processed with individual salinities, temperatures, pH scales, dissociation constants, etc.

HISTORY:
Original version for DOS was written by Lewis and Wallace. This was converted to MATLAB by Denis Pierrot 
at CIMAS, University of Miami, Miami, Florida. Vectorization, internal refinements and speed improvements 
were added by Steven van Heuven, University of Groningen, The Netherlands. Although functionality has 
been added, the output of the function has not changed. All versions of co2sys available at CDIAC 
(DOS, Excel for WINDOWS, Excel for MAC, MATLAB) should yield (near-) identical results when supplied 
with identical input. If you discover that they don't or you have a more general bug report, please 
email me, Denis Pierrot or Alex Kozyr (svheuven@gmail.com, Denis.Pierrot@noaa.gov, kozyra@ornl.gov). 

INSTALLING:
Download the m-file "CO2SYS.m" and, optionally, the two examples. Place the file(s) in a location that 
Matlab can see (or add the location of the file(s) to Matlab's search path).
Run either of the examples in Matlab, or start using the main routine straight away.

