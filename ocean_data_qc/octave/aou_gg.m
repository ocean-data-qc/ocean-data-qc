function c = aou_gg(SAL_THETA_OXY)
  
S=SAL_THETA_OXY(:,1);
T=SAL_THETA_OXY(:,2);
OXY=SAL_THETA_OXY(:,3);
% SW_SATO2   Saturation of O2 in sea water in umol/kgSW
%%%%%%%% NOTE: Modified from sw_sat02 by IIM-CSIC to use  Garcia and Gordon (1992) eq. to 
%%%%%%%% get the saturation in umol/kgsw !!!!!!!!!!!!!!!!!

%% REFERENCES:



% SW_SATO2   Satuaration of O2 in sea water
%=========================================================================
% sw_satO2 $Revision: 1.1 $  $Date: 1998/04/22 02:15:56 $
%          Copyright (C) CSIRO, Phil Morgan 1998.
%
% USAGE:  satO2 = sw_satO2(S,T)
%
% DESCRIPTION:
%    Solubility (satuaration) of Oxygen (O2) in sea water
%
% INPUT:  (all must have same dimensions)
%   S = salinity    [psu      (PSS-78)]
%   T = temperature [degree C (IPTS-68)]
%
% OUTPUT:
%   satO2 = solubility of O2  [umol/kgsw]
% 
% AUTHOR:  Phil Morgan 97-11-05  (morgan@ml.csiro.au)
%
%$$$ #include "disclaimer_in_code.inc"
%
% REFERENCES:
%    Weiss, R. F. 1970
%    "The solubility of nitrogen, oxygen and argon in water and seawater."
%    Deap-Sea Research., 1970, Vol 17, pp721-735.
%=========================================================================

% CALLER: general purpose
% CALLEE: 

%----------------------
% CHECK INPUT ARGUMENTS
%----------------------
if nargin ~=1
   error('satO2gg.m: Must pass 2 parameters')
end %if

% CHECK S,T dimensions and verify consistent
[ms,ns] = size(S);
[mt,nt] = size(T);

  
% CHECK THAT S & T HAVE SAME SHAPE
if (ms~=mt) | (ns~=nt)
   error('satO2gg: S & T must have same dimensions')
end %if

% IF ALL ROW VECTORS ARE PASSED THEN LET US PRESERVE SHAPE ON RETURN.
Transpose = 0;
if ms == 1  % row vector
   T       =  T(:);
   S       =  S(:);   
   Transpose = 1;
end %if

%------
% BEGIN
%------

% constants for Eqn of Garcia and Gordon 1992
% in ml/l
%A0=2.00907;
%A1=3.22014;
%A2=4.05010;
%A3=4.94457;
%A4=-0.256847;
%A5=3.88767;
%B0=-6.24523E-03;
%B1=-7.37614E-03;
%B2=-1.03410E-02;
%B3=-8.17083E-03;
%C0=-4.88682E-07;
% in umol/kgsw
A0=5.80871;
A1=3.20291;
A2=4.17887;
A3=5.10006;
A4=-9.86643E-02;
A5=3.80369;
B0=-7.01577E-03;
B1=-7.70028E-03;
B2=-1.13864E-02;
B3=-9.51519E-03;
C0=-2.75915E-07;

% According to Sarmiento and Gruber (2005): "Note that this equation uses a
% molar volume of 22.3916 l mol-1, rather than
% the ideal volume used in the Bunsen coefficient calculations."
Ts=log((298.15-T)./(273.15+T));

lnC0= A0 + A1.*Ts + A2.*Ts.^2 + A3.*Ts.^3 + A4.*Ts.^4 + A5.*Ts.^5 ...
  + S.*(B0 + B1.*Ts+ B2.*Ts.^2 + B3.*Ts.^3 ) ...
  + C0.*S.^2;

c = exp(lnC0);
c = c - OXY;



return

