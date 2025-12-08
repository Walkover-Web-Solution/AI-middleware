import configurationService from '../db_services/configuration.service.js';
import { getClientUsers } from '../services/proxy.service.js';

const deriveUserStatus = (bridges) => {
  if (!bridges.length) {
    return {
      status: 'no_bridge',
      hasPublishedVersion: false,
      totalTokens: 0,
      needsHelp: true,
    };
  }

  const hasPublishedVersion = bridges.some((bridge) => Boolean(bridge.publishedVersionId));
  const totalTokens = bridges.reduce((sum, bridge) => sum + bridge.totalTokens, 0);

  if (!hasPublishedVersion) {
    return {
      status: 'draft_only',
      hasPublishedVersion: false,
      totalTokens,
      needsHelp: true,
    };
  }

  if (totalTokens > 0) {
    return {
      status: 'active',
      hasPublishedVersion: true,
      totalTokens,
      needsHelp: false,
    };
  }

  return {
    status: 'published_no_usage',
    hasPublishedVersion: true,
    totalTokens,
    needsHelp: true,
  };
};

const analyzeClientUserStatus = async (req, res, next) => {
  try {
    const { itemsPerPage } = req.query;
    const orgId = req.profile?.org?.id ? String(req.profile.org.id) : null;
    const perPage = itemsPerPage ? Number(itemsPerPage) : undefined;

    const clientUsersResponse = await getClientUsers(perPage);
    const clientUsers = clientUsersResponse?.data?.data || [];

    const scopedUsers = orgId
      ? clientUsers.filter((user) =>
        Array.isArray(user.c_companies) &&
        user.c_companies.some((company) => String(company.id) === orgId)
      )
      : clientUsers;

    if (!scopedUsers.length) {
      res.locals = {
        success: true,
        data: [],
        message: 'No client users found for the requested scope.',
      };
      req.statusCode = 200;
      return next();
    }

    const userIds = scopedUsers.map((user) => String(user.id));

    let bridgeSummaries =  await configurationService.getBridgeSummariesByUserIds(userIds);


    const bridgesByUser = bridgeSummaries.reduce((acc, bridge) => {
      const userId = bridge.user_id;
      if (!userId) {
        return acc;
      }

      const normalizedBridge = {
        id: bridge._id,
        publishedVersionId: bridge.published_version_id,
        totalTokens: Number(bridge.total_tokens) || 0,
      };

      if (!acc[userId]) {
        acc[userId] = [];
      }
      acc[userId].push(normalizedBridge);
      return acc;
    }, {});

    const result = scopedUsers.map((user) => {
      const userId = String(user.id);
      const bridges = bridgesByUser[userId] || [];
      const { hasPublishedVersion, totalTokens, needsHelp,status } = deriveUserStatus(bridges);

      return {
        userId: user.id,
        contact: {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
        },
        totalTokens,
        hasPublishedVersion,
        needsHelp,
        status
      };
    });

    res.locals = {
      success: true,
      data: result,
      meta: {
        totalUsers: clientUsersResponse?.data?.totalEntityCount || scopedUsers.length,
        scannedUsers: scopedUsers.length
      },
    };
    req.statusCode = 200;
    return next();
  } catch (error) {
    console.error('Error analyzing client user status:', error);
    res.locals = { success: false, message: error.message || 'Failed to analyze client users.' };
    req.statusCode = 500;
    return next();
  }
};

export default {
  analyzeClientUserStatus,
};
