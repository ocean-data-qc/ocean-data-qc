function [T, SP] = teos2eos_geo(SA, CT, P, long, lat)
% teos2eos_geo:       Convert temperature and salinity from TEOS-10 to EOS-80
% 
% Description:
%      Convert conservative temperature to in-situ temperature and
%      Absolute Salinity (SA) to Practical Salinity (SP). Salinity
%      conversion depends on depth and geographic location.
% 
% Usage:
%      [T, SP] = teos2eos_geo(SA, CT, P, long, lat)
%      
% Input:
%       SA: Absolute Salinity in g/kg
%       CT: Conservative Temperature in degrees C
%        P: Sea water pressure in dbar
%     long: Longitude in decimal degrees [ 0 ... +360 ] or [ -180 ...
%           +180 ]
%      lat: latitude in decimal degrees [-90 ... 90]
% 
% Details:
%      Conversion from Absolute (SA) to Practical Salinity (SP) depends
%      on water density anomaly which is correlated with Silicate
%      concentration. This function relies on silicate concentration
%      taken from WOA (World Ocean Atlas) to evaluate density anomaly.
% 
% Output:
%        T: in situ Temperature (deg C)
%       SP: Practical Salinity (psu)
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
%      eos2teos_geo does the reverse, teos2eos_chem, sa2sp_geo
%      package GSW for Matlab
% 
% Examples:
%         % Calculate insitu Temperature and practical salinity of a sample with 
%         % Absolute Salinity of 35 g/kg, Conservative Temperature of 18 deg C,
%         % depth is 10 dbar and location is 188 degrees East and 4 degrees North.
%         [T, SP] = teos2eos_geo(35, 18, 10, 188, 4)
%      

    if (isempty(lat) || isempty(long))
        lat = 0; long = -25;
    end
    % convert temperature
    T = gsw_t_from_CT (SA, CT, P);
    % convert salinity
    SP = gsw_SP_from_SA(SA, P, long, lat);
end
