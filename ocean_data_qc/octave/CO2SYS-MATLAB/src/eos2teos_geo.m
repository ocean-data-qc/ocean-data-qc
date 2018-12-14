function [CT, SA] = eos2teos_geo(SP, T, P, long, lat)
% eos2teos_geo:        Convert temperature and salinity from EOS-80 to TEOS-10
% 
% Description:
%      Convert in-situ to Conservative temperature and Practical (SP) to
%      Absolute Salinity (SA) Salinity conversion depends on depth and
%      geographic location.
% 
% Usage:
%      [CT, SA] = eos2teos_geo(SP, T, P, long, lat)
%      
% Input:
%       SP: Practical Salinity on the practical salinity scale
%        T: in-situ temperature in deg. C
%        P: Sea water pressure in dbar
%     long: Longitude in decimal degrees [ 0 ... +360 ] or [ -180 ...
%           +180 ]
%      lat: latitude in decimal degrees [-90 ... 90]
% 
% Details:
%      Conversion from Practical (SP) to Absolute Salinity (SA) depends
%      on water density anomaly which is correlated with Silicate
%      concentration. This function relies on silicate concentration
%      taken from WOA (World Ocean Atlas) to evaluate density anomaly.
% 
% Output:
%       CT: Conservative Temperature (deg C)
%       SA: Absolute Salinity (g/kg)
% 
% Author(s):
%      Jean-Marie Epitalon
% 
% References:
%      TEOS-10 web site: http://www.teos-10.org/
% 
%      What every oceanographer needs to know about TEOS-10 (The TEOS-10
%      Primer) by Rich Pawlowicz (on TEOS-10 web site)
% 
%      T. J. McDougall, D. R. Jackett, F. J. Millero, R. Pawlowicz, 
%      and P. M. Barker, 2012: Algorithm for estimating
%      Absolute Salinity
% 
% See Also:
%      teos2eos_geo does the reverse, eos2teos_chem, sp2sa_geo
%      package GSW for Matlab
% 
% Examples:
%         % Calculate Conservative Temperature and Absolute Salinity of a sample with 
%         % Practical Salinity of 35 psu, in-situ Temperature of 18 deg C,
%         % depth is 10 dbar and location is 188 degrees East and 4 degrees North.
%         [CT, SA] = eos2teos_geo(35, 18, 10, 188, 4)
% 
    if (isempty(lat) || isempty(long))
        lat = 0; long = -25;
    end
    % convert salinity
    SA = gsw_SA_from_SP(SP, P, long, lat);
    % convert temperature
    CT = gsw_CT_from_t (SA, T, P);
end
