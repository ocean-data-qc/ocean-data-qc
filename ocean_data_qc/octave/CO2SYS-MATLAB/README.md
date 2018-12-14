**CITATION**

- If you use any CO2SYS related software, please cite the original work by Lewis and Wallace (1998).
- If you use CO2SYS.m, please cite van Heuven et al (2011).
- If you use errors.m or derivnum.m, please cite Orr et al. (2017).

**CO2SYS-MATLAB versions**

- 1.1 (Sept 2011): van Heuven et al. (2011) 
- 2.0 (Dec 20, 2016): Orr et al. (2017) - includes uncertainty propagation

**ABOUT CO2SYS**

Here you will find a MATLAB-version of CO2SYS, originally written for
DOS. CO2SYS calculates and returns a detailed state of the carbonate system for
oceanographic water samples, if supplied with sufficient input.  Use the CO2SYS
function as you would use any other MATLAB inline function, i.e.,
a=func(b,c). For much detail about how to use CO2SYS, simply type "help CO2SYS"
in MATLAB.  The help function also works for the two new uncertainty propagation
routines (errors and derivnum).  For details on the internal workings of CO2SYS,
please refer to the original publication (Lewis and Wallace, 1998) available at
http://cdiac.ornl.gov/oceans/co2rprt.html.  Since CO2SYS and the two new
routines each allow input of vectors, with just one call they can process many
samples.  Each sample may have a different salinity, temperature, pH scale,
dissociation constants, etc.

**HISTORY**

The original version for DOS was written by Lewis and Wallace (1998). That was
translated to MATLAB by Denis Pierrot at CIMAS, University of Miami, Miami,
Florida. Then that code was vectorized, refined, and optimized for computational
speed by Steven van Heuven, University of Groningen, The Netherlands. Although
functionality was added, the output of the CO2SYS function has not changed in
form. All versions of CO2SYS that are available at CDIAC (DOS, Excel, MATLAB)
should produce nearly identical results when supplied with identical
input. Indeed, close agreement between these different versions of CO2SYS was
demonstrated by Orr et al. (2015).  In 2016, CO2SYS-MATLAB was modified to
include error propagation (Orr et al., 2017): the main routine CO2SYS.m was
slightly modified, while two new routines were added (errors.m and derivnum.m)


If you discover inconsistencies or have a more general bug report for CO2SYS.m,
please notify S. van Heuven (svheuven at gmail.com), Denis Pierrot
(Denis.Pierrot at noaa.gov), or Alex Kozyr (kozyr at ornl.gov). For any concerns
about the error propagation routines (errors.m and derivnum.m), please contact
James Orr (james.orr at lsce.ipsl.fr)

**INSTALLING**

Download the m-files in the src directory (CO2SYS.m, errors.m, and derivnum.m);
you may also wish to download the examples in the examples directory.  Place
these files in a local directory that is in MATLAB's search path, or add the
directory where they are located to MATLAB's search path. The latter can be
done with MATLAB's addpath command, for example

addpath ("my_matlab_directory/my_subdir")

Then run either of the examples in Matlab, or start using the CO2SYS routine
straight away.

**COMPATIBILITY**

Besides their use in MATLAB, the three functions (CO2SYS.m, derivnum.m, and
errors.m) also work well under octave, GNU's MATLAB clone.

**EXAMPLES**

Example MATLAB scripts demonstrating use of CO2SYS can be found in the examples
directory. Using the two new routines is similar, adding only a few new
arguments, e.g., for input uncertainties.  Those examples will be added soon
using interactive jupyter notebooks in a new 'notebooks' directory. Meanwhile
just use "help errors" and "help derivnum" to find out more.

**REFERENCES**

Lewis, E. and Wallace, D. W. R.: Program Developed for CO2 System Calculations,
ORNL/CDIAC-105, Carbon Dioxide Inf.  Anal. Cent., Oak Ridge Natl. Lab., Oak
Ridge, Tenn., 38 pp., 1998.

Orr, J. C., J.-P. Gattuso, and J.-M. Epitalon. Comparison of ten packages that
compute ocean carbonate chemistry, Biogeosciences, 12, 1483–1510,
doi:10.5194/bg–12–1483–2015, 2015.

Orr, J.C., J.-M. Epitalon, A. G. Dickson, and J.-P. Gattuso (2017) Routine
uncertainty propagation for the marine carbon dioxide system, in prep. for
Mar. Chem., 2017.

van Heuven, S., D. Pierrot, J.W.B. Rae, E. Lewis, and D.W.R. Wallace (2011)
MATLAB Program Developed for CO2 System Calculations. ORNL/CDIAC-105b.  Carbon
Dioxide Information Analysis Center, Oak Ridge National Laboratory, U.S.
Department of Energy, Oak Ridge, Tennessee. doi:
10.3334/CDIAC/otg.CO2SYS_MATLAB_v1.1

